import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Robust custom RFC 4180 CSV parser supporting multi-line quoted fields
function parseCSV(text: string): string[][] {
  const result: string[][] = []
  let row: string[] = []
  let inQuotes = false
  let entry = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          entry += '"'
          i++ // skip double quote
        } else {
          inQuotes = false
        }
      } else {
        entry += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(entry)
        entry = ''
      } else if (char === '\n' || char === '\r') {
        row.push(entry)
        result.push(row)
        row = []
        entry = ''
        if (char === '\r' && next === '\n') {
          i++
        }
      } else {
        entry += char
      }
    }
  }
  if (row.length > 0 || entry !== '') {
    row.push(entry)
    result.push(row)
  }
  return result
}

export async function POST(request: Request) {
  try {
    const { csvText } = await request.json()
    if (!csvText) {
      return NextResponse.json({ error: 'No CSV data provided' }, { status: 400 })
    }

    const rows = parseCSV(csvText)
    if (rows.length < 2) {
      return NextResponse.json({ error: 'CSV is empty or missing headers' }, { status: 400 })
    }

    const headers = rows[0].map(h => h.trim().toLowerCase())
    
    // Validate headers
    const requiredHeaders = ['account', 'amount', 'date', 'income', 'category name']
    const missing = requiredHeaders.filter(h => !headers.includes(h))
    if (missing.length > 0) {
      return NextResponse.json({ 
        error: `Invalid CSV format. Missing required headers: ${missing.join(', ')}` 
      }, { status: 400 })
    }

    // Get column indices
    const idx = {
      account: headers.indexOf('account'),
      amount: headers.indexOf('amount'),
      currency: headers.indexOf('currency'),
      title: headers.indexOf('title'),
      note: headers.indexOf('note'),
      date: headers.indexOf('date'),
      income: headers.indexOf('income'),
      category: headers.indexOf('category name'),
      subcategory: headers.indexOf('subcategory name'),
      color: headers.indexOf('color'),
      icon: headers.indexOf('icon'),
    }

    const transactionsData = []

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r]
      // Skip empty rows
      if (row.length === 0 || (row.length === 1 && !row[0])) continue

      const account = row[idx.account]?.trim() || 'CASH'
      const amount = parseFloat(row[idx.amount]) || 0
      const currency = idx.currency !== -1 ? (row[idx.currency]?.trim() || 'BDT') : 'BDT'
      const title = idx.title !== -1 ? (row[idx.title]?.trim() || null) : null
      const note = idx.note !== -1 ? (row[idx.note]?.trim() || null) : null
      const dateStr = row[idx.date]?.trim()
      const isIncome = row[idx.income]?.trim().toLowerCase() === 'true'
      const category = row[idx.category]?.trim() || 'Other'
      const subcategory = idx.subcategory !== -1 ? (row[idx.subcategory]?.trim() || null) : null
      
      let color = idx.color !== -1 ? (row[idx.color]?.trim() || null) : null
      if (color && color.toUpperCase().startsWith('0XFF')) {
        color = '#' + color.substring(4) // Transform 0XFFAB47BC -> #AB47BC
      }
      const icon = idx.icon !== -1 ? (row[idx.icon]?.trim() || null) : null

      if (!dateStr) continue

      // Parse custom date: "YYYY-MM-DD HH:mm:ss.SSS" or standard ISO
      let dateObj: Date
      try {
        dateObj = new Date(dateStr.replace(' ', 'T'))
        if (isNaN(dateObj.getTime())) {
          dateObj = new Date(dateStr)
        }
      } catch (e) {
        continue
      }

      if (isNaN(dateObj.getTime())) continue

      const isBalanceCorrection = category.toLowerCase() === 'balance correction'

      transactionsData.push({
        account,
        amount,
        currency,
        title,
        note,
        date: dateObj,
        isIncome,
        category,
        subcategory,
        isBalanceCorrection,
        color,
        icon,
      })
    }

    // Delete existing transactions before import to avoid duplicates (optional or transactional merge)
    // We do a merge/create strategy. For now, since the PRD mentions importing Cashew exports periodically,
    // we can delete existing and bulk insert to ensure a clean sync of the exported file.
    await prisma.$transaction([
      prisma.transaction.deleteMany({}),
      ...transactionsData.map(data => prisma.transaction.create({ data }))
    ])

    return NextResponse.json({ 
      success: true, 
      count: transactionsData.length 
    })
  } catch (error) {
    console.error('Import CSV error:', error)
    return NextResponse.json({ error: 'Failed to import CSV data' }, { status: 500 })
  }
}
