// Billing & Payments: turns your shop orders and provider unlocks into one list
// of transactions. Nothing new is stored; it reads what the order and provider
// services already hold. Card and phone details are never kept, only the method.
import { getMyOrders } from './orderService'
import { getMyServiceRequests } from './providerService'

// Shape every transaction the same way so the page can treat them alike.
//  kind: 'shop' | 'provider'   status: 'Paid' | 'Due on delivery'
const fromOrder = (o) => ({
  reference: o.reference,
  kind: 'shop',
  date: o.createdAt,
  title: `Shop order · ${o.items.length} ${o.items.length === 1 ? 'item' : 'items'}`,
  amount: o.total,
  method: o.paid ? o.paymentMethod : 'Pay on delivery',
  status: o.paid ? 'Paid' : 'Due on delivery',
  lines: o.items.map((i) => ({ label: `${i.qty} x ${i.name}`, amount: i.qty * i.unitPrice })),
  subtotal: o.subtotal,
  deliveryFee: o.deliveryFee,
})

const fromUnlock = (r) => ({
  reference: r.reference,
  kind: 'provider',
  date: r.createdAt,
  title: `Contact unlocked · ${r.providerName}`,
  amount: r.fee,
  method: r.method,
  status: 'Paid',
  lines: [{ label: `One-off fee to unlock ${r.providerName}'s contact details`, amount: r.fee }],
  note: r.service ? `Service asked about: ${r.service}` : '',
})

export async function getMyTransactions() {
  const [orders, unlocks] = await Promise.all([getMyOrders(), getMyServiceRequests()])
  return [...orders.map(fromOrder), ...unlocks.map(fromUnlock)].sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Totals for the summary cards. Money "paid" only counts what is actually paid.
export function summarise(transactions) {
  const sum = (list) => list.reduce((total, t) => total + t.amount, 0)
  const paid = transactions.filter((t) => t.status === 'Paid')
  return {
    totalPaid: sum(paid),
    shopPaid: sum(paid.filter((t) => t.kind === 'shop')),
    shopCount: transactions.filter((t) => t.kind === 'shop').length,
    unlockPaid: sum(paid.filter((t) => t.kind === 'provider')),
    unlockCount: transactions.filter((t) => t.kind === 'provider').length,
    dueOnDelivery: sum(transactions.filter((t) => t.status === 'Due on delivery')),
  }
}

// A CSV copy of the list. Cells that start with = + - or @ are defused so a
// spreadsheet never runs them as a formula.
const cell = (v) => {
  const text = String(v ?? '')
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export function toCsv(transactions) {
  const head = ['Date', 'Reference', 'Type', 'Description', 'Method', 'Status', 'Amount (GHS)']
  const rows = transactions.map((t) => [
    new Date(t.date).toISOString().slice(0, 10), t.reference, t.kind === 'shop' ? 'Shop order' : 'Provider unlock', t.title, t.method, t.status, t.amount,
  ])
  return [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}
