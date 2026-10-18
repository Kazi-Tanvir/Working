// src/services/courier.service.ts
// CourierProvider interface and Steadfast Packzy API adapter with idempotent state locking

import { prisma } from '@/lib/prisma';
import { DispatchStatus } from '@prisma/client';

export interface CourierBookingResult {
  success: boolean;
  consignmentId?: string;
  trackingCode?: string;
  dispatchStatus: DispatchStatus;
  message?: string;
  rawResponse?: unknown;
}

export interface CourierProvider {
  createParcel(orderId: string): Promise<CourierBookingResult>;
  checkStatusByInvoice(invoiceNo: string): Promise<CourierBookingResult>;
}

export class SteadfastCourierService implements CourierProvider {
  private baseUrl = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';
  private apiKey = process.env.STEADFAST_API_KEY || '';
  private secretKey = process.env.STEADFAST_SECRET_KEY || '';

  /**
   * Idempotently book a parcel with Steadfast.
   * State Machine: Locks order to DISPATCHING first.
   * If network timeout occurs, sets state to NEEDS_RECONCILIATION.
   */
  async createParcel(orderId: string): Promise<CourierBookingResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        courierDispatch: true,
        items: true,
      },
    });

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PACKED') {
      throw new Error(`INVALID_ORDER_STATUS_FOR_DISPATCH: ${order.status}`);
    }

    // Check existing dispatch
    if (order.courierDispatch) {
      if (order.courierDispatch.dispatchStatus === 'BOOKED') {
        return {
          success: true,
          consignmentId: order.courierDispatch.consignmentId ?? undefined,
          trackingCode: order.courierDispatch.trackingCode ?? undefined,
          dispatchStatus: 'BOOKED',
          message: 'Already booked with Steadfast',
        };
      }

      if (order.courierDispatch.dispatchStatus === 'DISPATCHING') {
        throw new Error('DISPATCH_IN_PROGRESS_LOCK');
      }

      if (order.courierDispatch.dispatchStatus === 'NEEDS_RECONCILIATION') {
        throw new Error('NEEDS_RECONCILIATION_FIRST');
      }
    }

    const idempotencyKey = order.courierDispatch?.idempotencyKey || `sf_${order.id}_${Date.now()}`;

    // 1. Lock dispatch state to DISPATCHING
    await prisma.courierDispatch.upsert({
      where: { orderId: order.id },
      update: {
        dispatchStatus: 'DISPATCHING',
        attemptCount: { increment: 1 },
      },
      create: {
        orderId: order.id,
        idempotencyKey,
        dispatchStatus: 'DISPATCHING',
        codAmountSent: order.codCollectible,
        attemptCount: 1,
      },
    });

    // 2. Perform HTTP request to Steadfast API
    try {
      // Mock / Sandbox mode if API keys are not yet configured in merchant .env
      if (!this.apiKey || !this.secretKey || this.apiKey === 'your_steadfast_api_key') {
        const mockConsignmentId = `SF-MOCK-${order.invoiceNo.replace('INV-', '')}`;
        const mockTrackingCode = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

        await prisma.$transaction([
          prisma.courierDispatch.update({
            where: { orderId: order.id },
            data: {
              dispatchStatus: 'BOOKED',
              consignmentId: mockConsignmentId,
              trackingCode: mockTrackingCode,
              dispatchedAt: new Date(),
              lastError: null,
            },
          }),
          prisma.order.update({
            where: { id: order.id },
            data: { status: 'SHIPPED' },
          }),
          prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: 'SHIPPED',
              action: 'STEADFAST_BOOKED_MOCK',
              note: `Booked (Mock/Dev). CID: ${mockConsignmentId}`,
            },
          }),
        ]);

        return {
          success: true,
          consignmentId: mockConsignmentId,
          trackingCode: mockTrackingCode,
          dispatchStatus: 'BOOKED',
          message: 'Mock dispatch booked successfully',
        };
      }

      // Live Steadfast API request
      const payload = {
        invoice: order.invoiceNo,
        recipient_name: order.customerName,
        recipient_phone: order.customerPhone,
        recipient_address: order.customerAddress,
        cod_amount: order.codCollectible,
        note: `Order ${order.invoiceNo} - ${order.items.map((i) => `${i.productName} (${i.variantLabel})`).join(', ')}`,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.apiKey,
          'Secret-Key': this.secretKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json();

      if (response.ok && data.status === 200) {
        const consignmentId = String(data.consignment?.consignment_id || '');
        const trackingCode = String(data.consignment?.tracking_code || '');

        await prisma.$transaction([
          prisma.courierDispatch.update({
            where: { orderId: order.id },
            data: {
              dispatchStatus: 'BOOKED',
              consignmentId,
              trackingCode,
              dispatchedAt: new Date(),
              rawResponse: data,
              lastError: null,
            },
          }),
          prisma.order.update({
            where: { id: order.id },
            data: { status: 'SHIPPED' },
          }),
          prisma.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: 'SHIPPED',
              action: 'STEADFAST_BOOKED',
              note: `Consignment ID: ${consignmentId}, Tracking: ${trackingCode}`,
            },
          }),
        ]);

        return {
          success: true,
          consignmentId,
          trackingCode,
          dispatchStatus: 'BOOKED',
          rawResponse: data,
        };
      } else {
        const errorMsg = data.message || `Steadfast API error: ${response.status}`;
        await prisma.courierDispatch.update({
          where: { orderId: order.id },
          data: {
            dispatchStatus: 'FAILED',
            lastError: errorMsg,
            rawResponse: data,
          },
        });

        return {
          success: false,
          dispatchStatus: 'FAILED',
          message: errorMsg,
          rawResponse: data,
        };
      }
    } catch (err: unknown) {
      const isAbort = (err as Error)?.name === 'AbortError';
      const statusToSet: DispatchStatus = isAbort ? 'NEEDS_RECONCILIATION' : 'FAILED';
      const errMsg = (err as Error)?.message || 'Unknown network error';

      await prisma.courierDispatch.update({
        where: { orderId: order.id },
        data: {
          dispatchStatus: statusToSet,
          lastError: `Timeout/Error: ${errMsg}`,
        },
      });

      return {
        success: false,
        dispatchStatus: statusToSet,
        message: isAbort ? 'Network timeout during dispatch. Please reconcile status before retrying.' : errMsg,
      };
    }
  }

  /**
   * Reconcile status with Steadfast by invoice number
   */
  async checkStatusByInvoice(invoiceNo: string): Promise<CourierBookingResult> {
    if (!this.apiKey || !this.secretKey || this.apiKey === 'your_steadfast_api_key') {
      return {
        success: true,
        dispatchStatus: 'BOOKED',
        message: 'Mock status reconciled',
      };
    }

    const response = await fetch(`${this.baseUrl}/status_by_invoice/${invoiceNo}`, {
      headers: {
        'Api-Key': this.apiKey,
        'Secret-Key': this.secretKey,
      },
    });

    const data = await response.json();
    if (response.ok && data.status === 200 && data.delivery_status) {
      return {
        success: true,
        consignmentId: String(data.consignment_id || ''),
        trackingCode: String(data.tracking_code || ''),
        dispatchStatus: 'BOOKED',
        rawResponse: data,
      };
    }

    return {
      success: false,
      dispatchStatus: 'FAILED',
      message: data.message || 'Parcel not found on Steadfast',
      rawResponse: data,
    };
  }
}

export const courierService = new SteadfastCourierService();
