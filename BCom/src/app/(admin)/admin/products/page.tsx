// src/app/(admin)/admin/products/page.tsx
// ADMIN-only Product & Variant Stock Inventory CRUD

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await prisma.product
    .findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    .catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">প্রোডাক্ট ও ভ্যারিয়েন্ট স্টক ইনভেন্টরি</h1>
        <p className="text-sm text-slate-500">
          ভ্যারিয়েন্ট অনুযায়ী (Size M, L, XL) আসল স্টক পর্যবেক্ষণ করুন। স্টক শূন্য হলে সিস্টেমে আর অর্ডার নেওয়া হবে না।
        </p>
      </div>

      <div className="space-y-6">
        {products.map((prod) => (
          <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{prod.name}</h2>
                <div className="text-xs text-slate-500 font-mono">Slug: /offer/{prod.slug}</div>
              </div>
              <span className="text-xs bg-green-100 text-green-800 font-semibold px-2.5 py-1 rounded-full self-start">
                সক্রিয় ফানেল
              </span>
            </div>

            {/* Variants Stock Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase border-y border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">ভ্যারিয়েন্ট / সাইজ</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">রেগুলার মূল্য</th>
                    <th className="py-2.5 px-3">অফার মূল্য</th>
                    <th className="py-2.5 px-3">বর্তমান স্টক</th>
                    <th className="py-2.5 px-3">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prod.variants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-900">{v.label}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{v.sku}</td>
                      <td className="py-3 px-3 text-slate-400 line-through">৳{v.regularPrice}</td>
                      <td className="py-3 px-3 font-bold text-green-700">৳{v.salePrice}</td>
                      <td className="py-3 px-3 font-mono font-bold text-sm">
                        {v.stock > 0 ? (
                          <span className={v.stock <= 5 ? 'text-amber-600' : 'text-slate-900'}>
                            {v.stock} টি
                          </span>
                        ) : (
                          <span className="text-red-600">০ (শেষ)</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {v.stock > 0 ? (
                          <span className="bg-green-100 text-green-800 text-[11px] px-2 py-0.5 rounded-full font-medium">
                            ইন স্টক
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-800 text-[11px] px-2 py-0.5 rounded-full font-medium">
                            আউট অব স্টক
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
