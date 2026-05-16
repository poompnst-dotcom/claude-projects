import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './App.css'

const CATEGORIES = {
  income: ['เงินเดือน', 'ฟรีแลนซ์', 'โบนัส', 'การลงทุน', 'อื่นๆ (รายรับ)'],
  expense: ['อาหาร', 'เดินทาง', 'ที่พักอาศัย', 'สุขภาพ', 'บันเทิง', 'ช้อปปิ้ง', 'สาธารณูปโภค', 'อื่นๆ (รายจ่าย)'],
}

const MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

const formatMoney = (amount) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)

const todayISO = () => new Date().toISOString().split('T')[0]

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch { return initial }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue]
}

export default function App() {
  const [transactions, setTransactions] = useLocalStorage('fin_txns', [])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [form, setForm] = useState({ type: 'expense', amount: '', category: '', note: '', date: todayISO() })
  const [formError, setFormError] = useState('')
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [transactions])

  const monthlyData = useMemo(() => {
    const map = {}
    transactions.forEach(t => {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!map[key]) map[key] = { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 }
      map[key][t.type] += t.amount
    })
    return Object.values(map)
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .slice(-6)
      .map(m => ({ name: `${MONTH_NAMES[m.month]} ${m.year + 543 - 2500}`, รายรับ: m.income, รายจ่าย: m.expense }))
  }, [transactions])

  const filteredTxns = useMemo(() =>
    transactions.filter(t => t.date.startsWith(filterMonth)).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filterMonth])

  const monthSummary = useMemo(() => ({
    income: filteredTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filteredTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [filteredTxns])

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError('กรุณากรอกจำนวนเงินที่ถูกต้อง')
      return
    }
    if (!form.category) { setFormError('กรุณาเลือกหมวดหมู่'); return }
    setFormError('')
    setTransactions(prev => [{ id: Date.now(), ...form, amount: Number(form.amount) }, ...prev])
    setForm({ type: form.type, amount: '', category: '', note: '', date: todayISO() })
  }

  const handleDelete = (id) => setTransactions(prev => prev.filter(t => t.id !== id))

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="logo">💰 บัญชีการเงินส่วนตัว</h1>
          <nav className="nav">
            {[['dashboard','📊 ภาพรวม'],['add','➕ เพิ่มรายการ'],['monthly','📅 รายเดือน']].map(([tab, label]) => (
              <button key={tab} className={`nav-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>{label}</button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {activeTab === 'dashboard' && <Dashboard summary={summary} monthlyData={monthlyData} transactions={transactions} onDelete={handleDelete} />}
        {activeTab === 'add' && <AddForm form={form} setForm={setForm} onSubmit={handleAdd} error={formError} />}
        {activeTab === 'monthly' && <Monthly filterMonth={filterMonth} setFilterMonth={setFilterMonth} txns={filteredTxns} summary={monthSummary} onDelete={handleDelete} />}
      </main>
    </div>
  )
}

function SummaryCard({ label, amount, color, icon }) {
  return (
    <div className="card summary-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="card-icon">{icon}</div>
      <div>
        <p className="card-label">{label}</p>
        <p className="card-amount" style={{ color }}>{formatMoney(amount)}</p>
      </div>
    </div>
  )
}

function Dashboard({ summary, monthlyData, transactions, onDelete }) {
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)
  return (
    <div className="section">
      <div className="summary-grid">
        <SummaryCard label="รายรับทั้งหมด" amount={summary.income} color="#22c55e" icon="💵" />
        <SummaryCard label="รายจ่ายทั้งหมด" amount={summary.expense} color="#ef4444" icon="💸" />
        <SummaryCard label="ยอดคงเหลือ" amount={summary.balance} color={summary.balance >= 0 ? '#3b82f6' : '#f97316'} icon="🏦" />
      </div>

      {monthlyData.length > 0 && (
        <div className="card chart-card">
          <h2 className="section-title">สรุป 6 เดือนล่าสุด</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis tickFormatter={v => `฿${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={val => formatMoney(val)} />
              <Legend />
              <Bar dataKey="รายรับ" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="รายจ่าย" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {recent.length > 0 ? (
        <div className="card">
          <h2 className="section-title">รายการล่าสุด</h2>
          <TransactionList txns={recent} onDelete={onDelete} />
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>ยังไม่มีรายการ</p>
          <p className="empty-hint">เริ่มเพิ่มรายรับหรือรายจ่ายของคุณได้เลย</p>
        </div>
      )}
    </div>
  )
}

function AddForm({ form, setForm, onSubmit, error }) {
  const cats = CATEGORIES[form.type]
  return (
    <div className="section form-section">
      <div className="card form-card">
        <h2 className="section-title">เพิ่มรายการใหม่</h2>
        <form onSubmit={onSubmit} className="form">
          <div className="type-toggle">
            <button type="button" className={`type-btn${form.type === 'income' ? ' selected-income' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'income', category: '' }))}>
              💵 รายรับ
            </button>
            <button type="button" className={`type-btn${form.type === 'expense' ? ' selected-expense' : ''}`}
              onClick={() => setForm(f => ({ ...f, type: 'expense', category: '' }))}>
              💸 รายจ่าย
            </button>
          </div>

          <div className="form-row">
            <label className="form-label">จำนวนเงิน (บาท)</label>
            <input className="form-input" type="number" min="1" step="1" placeholder="0"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div className="form-row">
            <label className="form-label">หมวดหมู่</label>
            <select className="form-input" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">-- เลือกหมวดหมู่ --</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">วันที่</label>
            <input className="form-input" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>

          <div className="form-row">
            <label className="form-label">หมายเหตุ (ไม่บังคับ)</label>
            <input className="form-input" type="text" placeholder="ระบุรายละเอียดเพิ่มเติม..."
              value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>

          {error && <p className="form-error">⚠️ {error}</p>}

          <button type="submit" className={`submit-btn ${form.type === 'income' ? 'submit-income' : 'submit-expense'}`}>
            บันทึกรายการ
          </button>
        </form>
      </div>
    </div>
  )
}

function Monthly({ filterMonth, setFilterMonth, txns, summary, onDelete }) {
  const balance = summary.income - summary.expense
  return (
    <div className="section">
      <div className="card">
        <div className="monthly-header">
          <h2 className="section-title" style={{ margin: 0 }}>รายการประจำเดือน</h2>
          <input className="month-picker" type="month" value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)} />
        </div>
        <div className="month-summary-row">
          <span className="badge income-badge">รายรับ {formatMoney(summary.income)}</span>
          <span className="badge expense-badge">รายจ่าย {formatMoney(summary.expense)}</span>
          <span className={`badge ${balance >= 0 ? 'balance-badge-pos' : 'balance-badge-neg'}`}>คงเหลือ {formatMoney(balance)}</span>
        </div>
      </div>

      {txns.length > 0 ? (
        <div className="card">
          <TransactionList txns={txns} onDelete={onDelete} />
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>ไม่มีรายการในเดือนนี้</p>
        </div>
      )}
    </div>
  )
}

function TransactionList({ txns, onDelete }) {
  return (
    <ul className="txn-list">
      {txns.map(t => (
        <li key={t.id} className="txn-item">
          <div className={`txn-dot ${t.type}`} />
          <div className="txn-info">
            <span className="txn-category">{t.category}</span>
            {t.note && <span className="txn-note">{t.note}</span>}
            <span className="txn-date">{new Date(t.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="txn-right">
            <span className={`txn-amount ${t.type}`}>{t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}</span>
            <button className="delete-btn" onClick={() => onDelete(t.id)} title="ลบ">✕</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
