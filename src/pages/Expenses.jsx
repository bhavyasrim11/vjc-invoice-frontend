// ============================================================
// FILE: VJC-Invoice-frontend/src/pages/Expenses.jsx
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from "react";

// ─── Config ──────────────────────────────────────────────────
const API = "http://localhost:5000/api";

const CATEGORIES = [
  "Travel", "Meals", "Office Supplies", "Software", "Hardware",
  "Marketing", "Electricity & Water",
"Internet / Mobile", "Rent", "Entertainment", "Others"
];

const emptyForm = { date: "", category: "", customer: "", amount: "", billable: "true", notes: "" };

const STATUS_BADGE = {
  "Billable":     { bg: "#E6F1FB", color: "#0C447C" },
  "Non Billable": { bg: "#FAEEDA", color: "#633806" },
  "Invoiced":     { bg: "#EAF3DE", color: "#27500A" },
  "Reimbursed":   { bg: "#EEEDFE", color: "#3C3489" },
};

// ── Map DB row (snake_case) → frontend (camelCase) ────────────
const mapRow = (r) => ({
  id:        r.id,
  expenseNo: r.expense_no,
  date:      r.date?.slice(0, 10) || "",
  category:  r.category,
  customer:  r.customer || "-",
  amount:    Number(r.amount),
  billable:  r.billable,
  status:    r.status,
  notes:     r.notes || "",
});

// ─── Badge ───────────────────────────────────────────────────
function Badge({ status }) {
  const s = STATUS_BADGE[status] || { bg: "#F1EFE8", color: "#444441" };
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 99,
      fontSize: 12, fontWeight: 500, background: s.bg, color: s.color,
      whiteSpace: "nowrap"
    }}>
      {status}
    </span>
  );
}

// ─── Modal ───────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 14, padding: "28px 28px 24px",
        width: 480, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        border: "0.5px solid #e0e0e0"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────
function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 300,
      background: "#1a1a2e", color: "#fff", padding: "11px 20px",
      borderRadius: 8, fontSize: 13, fontWeight: 500,
      boxShadow: "0 4px 16px rgba(0,0,0,0.2)", pointerEvents: "none"
    }}>
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function Expenses() {
  const [expenses,        setExpenses]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showAdd,         setShowAdd]         = useState(false);
  const [editId,          setEditId]          = useState(null);
  const [deleteId,        setDeleteId]        = useState(null);
  const [form,            setForm]            = useState(emptyForm);
  const [formErrors,      setFormErrors]      = useState({});
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState("");
  const [filterCategory,  setFilterCategory]  = useState("");
  const [toast,           setToast]           = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // ── Fetch Expenses ──
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
const token = localStorage.getItem("vjc_invoice_auth");
const res = await fetch(`${API}/expenses`, {
  headers: { Authorization: `Bearer ${token}` }
});      const data = await res.json();
      setExpenses(Array.isArray(data) ? data.map(mapRow) : []);
    } catch (err) {
      showToast("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total       = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const billableAmt = expenses.filter(e => e.billable).reduce((s, e) => s + Number(e.amount), 0);
    const nonBillable = expenses.filter(e => !e.billable).length;
    const reimbursed  = expenses.filter(e => e.status === "Reimbursed").length;
    const invoiced    = expenses.filter(e => e.status === "Invoiced").length;
    return { total, billableAmt, nonBillable, reimbursed, invoiced };
  }, [expenses]);

  // ── Filter ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter(e => {
      const matchQ = !q ||
        e.expenseNo.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)  ||
        (e.customer || "").toLowerCase().includes(q);
      const matchS = !filterStatus   || e.status   === filterStatus;
      const matchC = !filterCategory || e.category === filterCategory;
      return matchQ && matchS && matchC;
    });
  }, [expenses, search, filterStatus, filterCategory]);

  const cats = useMemo(() => [...new Set(expenses.map(e => e.category))], [expenses]);

  // ── Open Add ──
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowAdd(true);
  };

  // ── Open Edit ──
  const openEdit = (id) => {
    const e = expenses.find(x => x.id === id);
    if (!e) return;
    setEditId(id);
    setForm({
      date:     e.date,
      category: e.category,
      customer: e.customer === "-" ? "" : e.customer,
      amount:   String(e.amount),
      billable: e.billable ? "true" : "false",
      notes:    e.notes || "",
    });
    setFormErrors({});
    setShowAdd(true);
  };

  // ── Validate ──
  const validate = () => {
    const errs = {};
    if (!form.category.trim()) errs.category = "Required";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      errs.amount = "Enter a valid amount";
    if (!form.date) errs.date = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save (Create / Update) ──
  const saveExpense = async () => {
    if (!validate()) return;
    const billable = form.billable === "true";
    const payload  = {
      date:     form.date,
      category: form.category,
      customer: form.customer.trim() || "-",
      amount:   Number(form.amount),
      billable,
      notes:    form.notes,
    };

    try {
      if (editId) {
const token = localStorage.getItem("vjc_invoice_auth");
const res = await fetch(`${API}/expenses/${editId}`, {
  method:  "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body:    JSON.stringify(payload),
});
        if (!res.ok) throw new Error(await res.text());
        showToast("Expense updated successfully ✅");
      } else {
        const token = localStorage.getItem("vjc_invoice_auth");
const res = await fetch(`${API}/expenses`, {
  method:  "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body:    JSON.stringify(payload),
});
        if (!res.ok) throw new Error(await res.text());
        showToast("Expense added successfully ✅");
      }
      await fetchExpenses();
      setShowAdd(false);
    } catch (err) {
      showToast("Failed to save: " + err.message);
    }
  };

  // ── Delete ──
  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API}/expenses/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      await fetchExpenses();
      setDeleteId(null);
      showToast("Expense deleted ✅");
    } catch (err) {
      showToast("Failed to delete: " + err.message);
    }
  };

  // ── Convert to Invoice ──
  const convertToInvoice = async (id) => {
    try {
      const res = await fetch(`${API}/expenses/${id}/convert`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      await fetchExpenses();
      showToast("Converted to Invoice ✅");
    } catch (err) {
      showToast("Failed: " + err.message);
    }
  };

  // ── Reimburse ──
  const reimburse = async (id) => {
    try {
      const res = await fetch(`${API}/expenses/${id}/reimburse`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      await fetchExpenses();
      showToast("Marked as Reimbursed ✅");
    } catch (err) {
      showToast("Failed: " + err.message);
    }
  };

  // ── Input helper ──
  const inp = (field) => ({
    value:    form[field],
    onChange: e => setForm(f => ({ ...f, [field]: e.target.value })),
    style: {
      width: "100%", padding: "9px 12px",
      border: `1px solid ${formErrors[field] ? "#e24b4a" : "#ddd"}`,
      borderRadius: 8, fontSize: 14, outline: "none",
      background: "#fafafa", color: "#1a1a1a", boxSizing: "border-box"
    }
  });

  const fieldStyle = { marginBottom: 14 };
  const labelStyle = { fontSize: 12, color: "#666", marginBottom: 4, display: "block", fontWeight: 500 };
  const errStyle   = { fontSize: 11, color: "#e24b4a", marginTop: 3 };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ padding: "24px 28px", background: "#f4f6fb", minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Expenses</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>Track and manage all business expenses</p>
        </div>
        <button onClick={openAdd} style={{
          background: "#185FA5", color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 7
        }}>
          + New Expense
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Expenses",  value: `₹${stats.total.toLocaleString("en-IN")}`,       color: "#185FA5", bg: "#E6F1FB" },
          { label: "Billable Amount", value: `₹${stats.billableAmt.toLocaleString("en-IN")}`, color: "#3B6D11", bg: "#EAF3DE" },
          { label: "Non Billable",    value: stats.nonBillable,                                color: "#854F0B", bg: "#FAEEDA" },
          { label: "Invoiced",        value: stats.invoiced,                                   color: "#534AB7", bg: "#EEEDFE" },
          { label: "Reimbursed",      value: stats.reimbursed,                                 color: "#993556", bg: "#FBEAF0" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#fff", borderRadius: 12, padding: "16px 18px",
            border: "0.5px solid #e8e8e8", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
          }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: s.bg }} />
          </div>
        ))}
      </div>

      {/* Expense List */}
      <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e8e8e8", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "0.5px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e" }}>All Expenses</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="text" placeholder="Search expense, category, customer..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: "7px 12px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, outline: "none", width: 240, background: "#fafafa" }}
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "7px 11px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, background: "#fafafa", outline: "none", color: "#1a1a1a" }}>
              <option value="">All Status</option>
              <option>Billable</option>
              <option>Non Billable</option>
              <option>Invoiced</option>
              <option>Reimbursed</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              style={{ padding: "7px 11px", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, background: "#fafafa", outline: "none", color: "#1a1a1a" }}>
              <option value="">All Categories</option>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
              Loading...
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f9fb" }}>
                  {["Expense No", "Date", "Category", "Customer", "Amount", "Status", "Workflow", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600,
                      color: "#888", textTransform: "uppercase", letterSpacing: "0.04em",
                      whiteSpace: "nowrap", borderBottom: "0.5px solid #f0f0f0"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "#aaa", fontSize: 14 }}>
                      No expenses found
                    </td>
                  </tr>
                ) : filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: "0.5px solid #f5f5f5" }}
                    onMouseEnter={ev => ev.currentTarget.style.background = "#fafbff"}
                    onMouseLeave={ev => ev.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#185FA5" }}>{e.expenseNo}</td>
                    <td style={{ padding: "12px 16px", color: "#555" }}>{e.date}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#f4f6fb", padding: "3px 10px", borderRadius: 6, fontSize: 12, color: "#444", fontWeight: 500 }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: e.customer === "-" ? "#bbb" : "#333" }}>{e.customer}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1a1a2e" }}>
                      ₹{Number(e.amount).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 16px" }}><Badge status={e.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      {e.status === "Billable" && (
                        <button onClick={() => convertToInvoice(e.id)} style={{
                          background: "#E6F1FB", color: "#0C447C", border: "1px solid #B5D4F4",
                          borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap"
                        }}>Convert to Invoice</button>
                      )}
                      {e.status === "Invoiced" && (
                        <button onClick={() => reimburse(e.id)} style={{
                          background: "#EAF3DE", color: "#27500A", border: "1px solid #C0DD97",
                          borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600,
                          cursor: "pointer", whiteSpace: "nowrap"
                        }}>Reimburse</button>
                      )}
                      {e.status === "Non Billable" && (
                        <span style={{ fontSize: 12, color: "#bbb" }}>Closed</span>
                      )}
                      {e.status === "Reimbursed" && (
                        <span style={{ fontSize: 12, color: "#534AB7", fontWeight: 600 }}>✓ Completed</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(e.id)} title="Edit"
                          style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 13, color: "#555" }}>
                          ✏️
                        </button>
                        <button onClick={() => setDeleteId(e.id)} title="Delete"
                          style={{ background: "none", border: "1px solid #f5c1c1", borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 13, color: "#e24b4a" }}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "0.5px solid #f0f0f0", fontSize: 12, color: "#aaa" }}>
          Showing {filtered.length} of {expenses.length} expenses
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editId ? "Edit Expense" : "New Expense"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Date *</label>
            <input type="date" {...inp("date")} />
            {formErrors.date && <div style={errStyle}>{formErrors.date}</div>}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Category *</label>
            <select {...inp("category")}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {formErrors.category && <div style={errStyle}>{formErrors.category}</div>}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Customer</label>
            <input type="text" {...inp("customer")} placeholder="Customer name (optional)" />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Amount (₹) *</label>
            <input type="number" {...inp("amount")} placeholder="0.00" min="0" />
            {formErrors.amount && <div style={errStyle}>{formErrors.amount}</div>}
          </div>
          <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Type</label>
            <select {...inp("billable")}>
              <option value="true">Billable</option>
              <option value="false">Non Billable</option>
            </select>
          </div>
          <div style={{ ...fieldStyle, gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Notes</label>
            <textarea {...inp("notes")} placeholder="Optional notes..." rows={2}
              style={{ ...inp("notes").style, resize: "vertical", fontFamily: "inherit" }} />
          </div>
        </div>

       
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setShowAdd(false)} style={{
            background: "none", border: "1px solid #ddd", borderRadius: 8,
            padding: "9px 18px", fontSize: 14, cursor: "pointer", color: "#555"
          }}>Cancel</button>
          <button onClick={saveExpense} style={{
            background: "#185FA5", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}>
            {editId ? "Update Expense" : "Save Expense"}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense">
        <p style={{ fontSize: 14, color: "#555", marginBottom: 20, lineHeight: 1.6 }}>
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={() => setDeleteId(null)} style={{
            background: "none", border: "1px solid #ddd", borderRadius: 8,
            padding: "9px 18px", fontSize: 14, cursor: "pointer", color: "#555"
          }}>Cancel</button>
          <button onClick={confirmDelete} style={{
            background: "#e24b4a", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}>Delete</button>
        </div>
      </Modal>

      <Toast message={toast} />
    </div>
  );
}