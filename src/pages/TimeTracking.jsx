import { useState, useEffect, useRef } from "react";

const API = "https://vjc-invoice-backend.vercel.app/api";

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#1a73e8", color: "#fff", padding: "12px 24px",
      borderRadius: 8, fontWeight: 600, fontSize: 14,
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)"
    }}>{message}</div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children, width = 520 }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 28, width, maxWidth: "95vw",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Live Timer ───────────────────────────────────────────────────────────────
function LiveTimer({ running, seconds }) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return (
    <span style={{
      fontFamily: "monospace", fontSize: 28, fontWeight: 700,
      color: running ? "#1a73e8" : "#333", letterSpacing: 2
    }}>{h}:{m}:{s}</span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "16px 20px",
      flex: 1, minWidth: 130, boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      border: "1px solid #f0f0f0"
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "#1a73e8" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      background: `${color}18`, color, padding: "3px 10px",
      borderRadius: 20, fontSize: 12, fontWeight: 600
    }}>{label}</span>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 7,
  border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box",
  outline: "none", marginTop: 4
};
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 2 };

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TimeTracking() {
  const [tab, setTab] = useState("timeLogs"); // timeLogs | expenses | retainers | projects
  const [timeLogs, setTimeLogs]     = useState([]);
  const [projects, setProjects]     = useState([]);
  const [expenses, setExpenses]     = useState([]);
  const [retainers, setRetainers]   = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(true);

  // Timer
  const [timerRunning, setTimerRunning]   = useState(false);
  const [timerSeconds, setTimerSeconds]   = useState(0);
  const [timerProject, setTimerProject]   = useState("");
  const [timerTask, setTimerTask]         = useState("");
  const [timerBillable, setTimerBillable] = useState(true);
  const timerRef = useRef(null);

  // Modals
  const [showLogModal, setShowLogModal]         = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRetainerModal, setShowRetainerModal] = useState(false);
  const [showDeleteId, setShowDeleteId]         = useState(null);
  const [deleteType, setDeleteType]             = useState("log"); // log | expense | retainer
  const [editLog, setEditLog]                   = useState(null);
  const [editExpense, setEditExpense]           = useState(null);
  const [profData, setProfData]                 = useState(null);

  // Filters
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterProject, setFilterProject] = useState("All");
  const [searchText, setSearchText]       = useState("");
  const [filterExpCat, setFilterExpCat]   = useState("All");

  const [toast, setToast] = useState("");

  // Forms
  const [logForm, setLogForm] = useState({
    projectId: "", date: new Date().toISOString().slice(0, 10),
    task: "", hours: "", billable: true, notes: ""
  });
  const [projForm, setProjForm] = useState({
    name: "", customerId: "", status: "Active", budget: "", hourly_rate: "1500"
  });
  const [expForm, setExpForm] = useState({
    projectId: "", expense_date: new Date().toISOString().slice(0, 10),
    category: "Other", description: "", amount: "", billable: true, receipt_url: ""
  });
  const [retForm, setRetForm] = useState({
    projectId: "", amount: "", period_start: "", period_end: "", notes: ""
  });

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [ttRes, custRes] = await Promise.all([
        fetch(`${API}/timetracking`),
        fetch(`${API}/customers`),
      ]);
      const ttData   = await ttRes.json();
      const custData = await custRes.json();
      if (ttData.success) {
        setTimeLogs(ttData.logs || []);
        setProjects(ttData.projects || []);
        setExpenses(ttData.expenses || []);
        setRetainers(ttData.retainers || []);
        setStats(ttData.stats || {});
      }
      if (custData.success) setCustomers(custData.customers || []);
    } catch {
      setToast("Backend connection failed!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  function startTimer() {
    if (!timerProject) { setToast("Please select a project first!"); return; }
    setTimerRunning(true);
  }

  async function stopTimer() {
    setTimerRunning(false);
    if (timerSeconds > 0) {
      const hrs  = +(timerSeconds / 3600).toFixed(2);
      const proj = projects.find(p => String(p.id) === String(timerProject));
      try {
        const res = await fetch(`${API}/timetracking/logs`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: timerProject, customer_id: proj?.customer_id || null,
            log_date: new Date().toISOString().slice(0, 10),
            task: timerTask || "Timer Entry", hours: hrs, billable: timerBillable,
            notes: "Logged via timer",
          }),
        });
        const data = await res.json();
        if (data.success) { setToast(`Time logged: ${hrs} hrs`); await fetchAll(); }
        else setToast("Failed: " + data.message);
      } catch { setToast("Failed to save time log"); }
      setTimerSeconds(0); setTimerTask("");
    }
  }

  // ── Log CRUD ───────────────────────────────────────────────
  function openAddLog() {
    setEditLog(null);
    setLogForm({ projectId: "", date: new Date().toISOString().slice(0,10), task: "", hours: "", billable: true, notes: "" });
    setShowLogModal(true);
  }
  function openEditLog(log) {
    setEditLog(log);
    setLogForm({ projectId: log.project_id, date: log.log_date?.slice(0,10), task: log.task, hours: log.hours, billable: !!log.billable, notes: log.notes||"" });
    setShowLogModal(true);
  }
  async function saveLog() {
    if (!logForm.projectId || !logForm.task || !logForm.hours) { setToast("Fill required fields!"); return; }
    const proj = projects.find(p => String(p.id) === String(logForm.projectId));
    const url  = editLog ? `${API}/timetracking/logs/${editLog.id}` : `${API}/timetracking/logs`;
    const method = editLog ? "PUT" : "POST";
    try {
      const res  = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: logForm.projectId, customer_id: proj?.customer_id||null,
          log_date: logForm.date, task: logForm.task, hours: logForm.hours,
          billable: logForm.billable, notes: logForm.notes
        }),
      });
      const data = await res.json();
      if (data.success) { setToast(editLog ? "Log updated!" : "Log added!"); await fetchAll(); }
      else setToast("Failed: " + data.message);
    } catch { setToast("Failed"); }
    setShowLogModal(false);
  }
  async function deleteLog(id) {
    try {
      await fetch(`${API}/timetracking/logs/${id}`, { method: "DELETE" });
      setToast("Deleted!"); await fetchAll();
    } catch { setToast("Failed"); }
    setShowDeleteId(null);
  }
  async function convertToInvoice(log) {
    try {
      const res  = await fetch(`${API}/timetracking/logs/${log.id}/convert`, { method: "POST" });
      const data = await res.json();
      if (data.success) { setToast("✅ Invoice created successfully"); await fetchAll(); }
      else setToast("❌ " + data.message);
    } catch { setToast("Failed"); }
  }

  // ── Expense CRUD ───────────────────────────────────────────
  function openAddExpense() {
    setEditExpense(null);
    setExpForm({ projectId: "", expense_date: new Date().toISOString().slice(0,10), category: "Other", description: "", amount: "", billable: true, receipt_url: "" });
    setShowExpenseModal(true);
  }
  function openEditExpense(exp) {
    setEditExpense(exp);
    setExpForm({ projectId: exp.project_id, expense_date: exp.expense_date?.slice(0,10), category: exp.category, description: exp.description, amount: exp.amount, billable: !!exp.billable, receipt_url: exp.receipt_url||"" });
    setShowExpenseModal(true);
  }
  async function saveExpense() {
    if (!expForm.projectId || !expForm.description || !expForm.amount) { setToast("Fill required fields!"); return; }
    const url    = editExpense ? `${API}/timetracking/expenses/${editExpense.id}` : `${API}/timetracking/expenses`;
    const method = editExpense ? "PUT" : "POST";
    try {
      const res  = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: expForm.projectId, expense_date: expForm.expense_date, category: expForm.category, description: expForm.description, amount: expForm.amount, billable: expForm.billable, receipt_url: expForm.receipt_url }),
      });
      const data = await res.json();
      if (data.success) { setToast(editExpense ? "Expense updated!" : "Expense added!"); await fetchAll(); }
      else setToast("Failed: " + data.message);
    } catch { setToast("Failed"); }
    setShowExpenseModal(false);
  }
  async function deleteExpense(id) {
    try { await fetch(`${API}/timetracking/expenses/${id}`, { method: "DELETE" }); setToast("Deleted!"); await fetchAll(); }
    catch { setToast("Failed"); }
    setShowDeleteId(null);
  }
  async function convertExpenseToInvoice(exp) {
    try {
      const res  = await fetch(`${API}/timetracking/expenses/${exp.id}/convert`, { method: "POST" });
      const data = await res.json();
      if (data.success) { setToast(`✅ Invoice created! ₹${Number(data.amount).toLocaleString("en-IN")}`); await fetchAll(); }
      else setToast("❌ " + data.message);
    } catch { setToast("Failed"); }
  }

  // ── Retainer CRUD ──────────────────────────────────────────
  async function saveRetainer() {
    if (!retForm.projectId || !retForm.amount) { setToast("Fill required fields!"); return; }
    try {
      const res  = await fetch(`${API}/timetracking/retainers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: retForm.projectId, amount: retForm.amount, period_start: retForm.period_start, period_end: retForm.period_end, notes: retForm.notes }),
      });
      const data = await res.json();
      if (data.success) { setToast("Retainer created! " + data.retainer_no); await fetchAll(); }
      else setToast("Failed: " + data.message);
    } catch { setToast("Failed"); }
    setShowRetainerModal(false);
  }
  async function markRetainerPaid(id) {
    try {
      const res  = await fetch(`${API}/timetracking/retainers/${id}/pay`, { method: "POST" });
      const data = await res.json();
      if (data.success) { setToast(`✅ Retainer paid! Invoice: ${data.invoice_no}`); await fetchAll(); }
      else setToast("❌ " + data.message);
    } catch { setToast("Failed"); }
  }

  // ── Project CRUD ───────────────────────────────────────────
  async function saveProject() {
    if (!projForm.name || !projForm.customerId) { setToast("Fill required fields!"); return; }
    try {
      const res  = await fetch(`${API}/timetracking/projects`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projForm.name, customer_id: projForm.customerId, status: projForm.status, budget: +projForm.budget||0, hourly_rate: +projForm.hourly_rate||1500 }),
      });
      const data = await res.json();
      if (data.success) { setToast("Project created!"); await fetchAll(); }
      else setToast("Failed: " + data.message);
    } catch { setToast("Failed"); }
    setProjForm({ name:"", customerId:"", status:"Active", budget:"", hourly_rate:"1500" });
    setShowProjectModal(false);
  }

  // ── Profitability ──────────────────────────────────────────
  async function loadProfitability(pid) {
    try {
      const res  = await fetch(`${API}/timetracking/projects/${pid}/profitability`);
      const data = await res.json();
      if (data.success) setProfData(data);
      else setToast("Failed to load profitability");
    } catch { setToast("Failed"); }
  }

  // ── Filtered data ──────────────────────────────────────────
  const filteredLogs = timeLogs.filter(l => {
    const status = l.invoiced ? "Invoiced" : l.billable ? "Billable" : "Non Billable";
    if (filterStatus !== "All" && status !== filterStatus) return false;
    if (filterProject !== "All" && String(l.project_id) !== filterProject) return false;
    if (searchText && !`${l.task} ${l.project_name} ${l.customer_name}`.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (filterExpCat !== "All" && e.category !== filterExpCat) return false;
    if (filterProject !== "All" && String(e.project_id) !== filterProject) return false;
    return true;
  });

  const CATEGORIES = ["Travel","Software","Hardware","Meals","Subscription","Other"];

  const totalHours   = Number(stats.total_hours || 0).toFixed(1);
  const billableHrs  = Number(stats.billable_hours || 0).toFixed(1);
  const billableAmt  = Number(stats.billable_amount || 0).toLocaleString("en-IN");
  const totalExp     = Number(stats.total_expenses || 0).toLocaleString("en-IN");
  const pendingRet   = Number(stats.pending_retainers || 0).toLocaleString("en-IN");

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading...</div>;

  return (
    <div style={{ padding: "24px 28px", background: "#f7f8fc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Time Tracking</h2>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Log time · Track expenses · Retainers · Convert to Invoices</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => setShowProjectModal(true)} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #1a73e8", background: "#fff", color: "#1a73e8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Project</button>
          <button onClick={() => { setRetForm({ projectId:"", amount:"", period_start:"", period_end:"", notes:"" }); setShowRetainerModal(true); }} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #9c27b0", background: "#fff", color: "#9c27b0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Retainer</button>
          <button onClick={openAddExpense} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #ff6d00", background: "#fff", color: "#ff6d00", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Expense</button>
          <button onClick={openAddLog} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Log Time</button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Total Hours"      value={`${totalHours} hrs`}  color="#1a73e8" />
        <StatCard label="Billable Hours"   value={`${billableHrs} hrs`} color="#34a853" />
        <StatCard label="Billable Amount"  value={`₹${billableAmt}`}    color="#34a853" />
        <StatCard label="Total Expenses"   value={`₹${totalExp}`}       color="#ff6d00" sub="project expenses" />
        <StatCard label="Pending Retainers" value={`₹${pendingRet}`}    color="#9c27b0" sub="to be invoiced" />
        <StatCard label="Active Projects"  value={stats.active_projects || 0} color="#1a73e8" />
      </div>

      {/* ── Timer Card ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0" }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#1a1a2e" }}>⏱ Log Time Using Timer</div>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Project *</label>
            <select value={timerProject} onChange={e => setTimerProject(e.target.value)} style={inputStyle}>
              <option value="">Select Project</option>
              {projects.filter(p => p.status === "Active").map(p => (
                <option key={p.id} value={p.id}>{p.name} (₹{p.hourly_rate}/hr)</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={labelStyle}>Task Description</label>
            <input value={timerTask} onChange={e => setTimerTask(e.target.value)} placeholder="What are you working on?" style={inputStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 6 }}>
            <input type="checkbox" id="tbill" checked={timerBillable} onChange={e => setTimerBillable(e.target.checked)} />
            <label htmlFor="tbill" style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Billable</label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 4 }}>
            <LiveTimer running={timerRunning} seconds={timerSeconds} />
            {!timerRunning
              ? <button onClick={startTimer} style={{ padding: "9px 20px", borderRadius: 8, background: "#34a853", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>▶ Start</button>
              : <button onClick={stopTimer}  style={{ padding: "9px 20px", borderRadius: 8, background: "#ea4335", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>⏹ Stop & Save</button>
            }
            <button onClick={() => { setTimerRunning(false); setTimerSeconds(0); }} style={{ padding: "9px 14px", borderRadius: 8, background: "none", border: "1px solid #ddd", color: "#555", fontSize: 13, cursor: "pointer" }}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 18, borderBottom: "2px solid #e8eaf0" }}>
        {[
          { key: "timeLogs",  label: "Time Logs" },
          { key: "expenses",  label: `Expenses (${expenses.length})` },
          { key: "retainers", label: `Retainers (${retainers.length})` },
          { key: "projects",  label: "Projects" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 22px", border: "none", background: "none", fontWeight: 600,
            fontSize: 14, cursor: "pointer",
            color: tab === t.key ? "#1a73e8" : "#888",
            borderBottom: tab === t.key ? "2px solid #1a73e8" : "2px solid transparent",
            marginBottom: -2
          }}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB: TIME LOGS
      ══════════════════════════════════════════════════════ */}
      {tab === "timeLogs" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", flex: 1 }}>All Time Logs</span>
            <input placeholder="Search task, project, customer..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, width: 220 }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
              <option>All</option><option>Billable</option><option>Non Billable</option><option>Invoiced</option>
            </select>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f7f8fc" }}>
                  {["Log No","Date","Project","Customer","Task","Hours","Rate","Amount","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>No time logs found</td></tr>
                )}
                {filteredLogs.map(log => {
                  const status = log.invoiced ? "Invoiced" : log.billable ? "Billable" : "Non Billable";
                  const statusColor = log.invoiced ? "#34a853" : log.billable ? "#1a73e8" : "#fbbc04";
                  const rate   = Number(log.hourly_rate || log.proj_rate || 1500);
                  const amount = log.billable ? `₹${(Number(log.hours) * rate).toLocaleString("en-IN")}` : "-";
                  return (
                    <tr key={log.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 12px", color: "#1a73e8", fontWeight: 600 }}>{log.log_no}</td>
                      <td style={{ padding: "12px 12px", color: "#555" }}>{log.log_date?.slice(0,10)}</td>
                      <td style={{ padding: "12px 12px", color: "#333" }}>{log.project_name||"-"}</td>
                      <td style={{ padding: "12px 12px", color: "#333" }}>{log.customer_name||"-"}</td>
                      <td style={{ padding: "12px 12px", color: "#333" }}>{log.task}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600 }}>{log.hours}h</td>
                      <td style={{ padding: "12px 12px", color: "#888", fontSize: 12 }}>₹{rate}/hr</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#34a853" }}>{amount}</td>
                      <td style={{ padding: "12px 12px" }}><Badge label={status} color={statusColor} /></td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!log.invoiced && log.billable && (
                            <button onClick={() => convertToInvoice(log)} style={{ padding: "4px 10px", borderRadius: 6, background: "#1a73e818", color: "#1a73e8", border: "1px solid #1a73e8", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>→ Invoice</button>
                          )}
                          {log.invoiced && <span style={{ color: "#34a853", fontSize: 12, fontWeight: 600 }}>✓</span>}
                          <button onClick={() => openEditLog(log)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fbbc04", fontSize: 16, padding: 2 }}>✎</button>
                          <button onClick={() => { setShowDeleteId(log.id); setDeleteType("log"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ea4335", fontSize: 15, padding: 2 }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, color: "#aaa", fontSize: 13 }}>Showing {filteredLogs.length} of {timeLogs.length} logs</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: PROJECT EXPENSES
      ══════════════════════════════════════════════════════ */}
      {tab === "expenses" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", flex: 1 }}>Project Expenses</span>
            <select value={filterExpCat} onChange={e => setFilterExpCat(e.target.value)} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={openAddExpense} style={{ padding: "7px 16px", borderRadius: 7, background: "#ff6d00", color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add Expense</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f7f8fc" }}>
                  {["Exp No","Date","Project","Customer","Category","Description","Amount","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>No expenses found</td></tr>
                )}
                {filteredExpenses.map(exp => {
                  const status      = exp.invoiced ? "Invoiced" : exp.billable ? "Billable" : "Non-Billable";
                  const statusColor = exp.invoiced ? "#34a853" : exp.billable ? "#ff6d00" : "#fbbc04";
                  return (
                    <tr key={exp.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 12px", color: "#ff6d00", fontWeight: 600 }}>{exp.expense_no}</td>
                      <td style={{ padding: "12px 12px", color: "#555" }}>{exp.expense_date?.slice(0,10)}</td>
                      <td style={{ padding: "12px 12px" }}>{exp.project_name||"-"}</td>
                      <td style={{ padding: "12px 12px" }}>{exp.customer_name||"-"}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <Badge label={exp.category} color="#ff6d00" />
                      </td>
                      <td style={{ padding: "12px 12px" }}>{exp.description}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#ff6d00" }}>₹{Number(exp.amount).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 12px" }}><Badge label={status} color={statusColor} /></td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!exp.invoiced && exp.billable && (
                            <button onClick={() => convertExpenseToInvoice(exp)} style={{ padding: "4px 10px", borderRadius: 6, background: "#ff6d0018", color: "#ff6d00", border: "1px solid #ff6d00", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>→ Invoice</button>
                          )}
                          <button onClick={() => openEditExpense(exp)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fbbc04", fontSize: 16, padding: 2 }}>✎</button>
                          <button onClick={() => { setShowDeleteId(exp.id); setDeleteType("expense"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ea4335", fontSize: 15, padding: 2 }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, color: "#aaa", fontSize: 13 }}>
            Total: ₹{filteredExpenses.reduce((s,e) => s + Number(e.amount), 0).toLocaleString("en-IN")} across {filteredExpenses.length} expenses
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: RETAINER INVOICES
      ══════════════════════════════════════════════════════ */}
      {tab === "retainers" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", flex: 1 }}>Retainer Invoices</span>
            <button onClick={() => { setRetForm({ projectId:"", amount:"", period_start:"", period_end:"", notes:"" }); setShowRetainerModal(true); }}
              style={{ padding: "7px 16px", borderRadius: 7, background: "#9c27b0", color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ New Retainer</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f7f8fc" }}>
                  {["Retainer No","Project","Customer","Period","Amount","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retainers.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>No retainers yet</td></tr>
                )}
                {retainers.map(r => {
                  const color = r.status === "Paid" ? "#34a853" : r.status === "Cancelled" ? "#ea4335" : "#9c27b0";
                  return (
                    <tr key={r.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 12px", color: "#9c27b0", fontWeight: 600 }}>{r.retainer_no}</td>
                      <td style={{ padding: "12px 12px" }}>{r.project_name||"-"}</td>
                      <td style={{ padding: "12px 12px" }}>{r.customer_name||"-"}</td>
                      <td style={{ padding: "12px 12px", color: "#555", fontSize: 12 }}>{r.period_start} → {r.period_end}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#9c27b0" }}>₹{Number(r.amount).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 12px" }}><Badge label={r.status} color={color} /></td>
                      <td style={{ padding: "12px 12px" }}>
                        {r.status === "Pending" && (
                          <button onClick={() => markRetainerPaid(r.id)} style={{ padding: "4px 12px", borderRadius: 6, background: "#9c27b018", color: "#9c27b0", border: "1px solid #9c27b0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Mark Paid → Invoice</button>
                        )}
                        {r.status === "Paid" && <span style={{ color: "#34a853", fontSize: 12, fontWeight: 600 }}>✓ Invoiced</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: PROJECTS + PROFITABILITY
      ══════════════════════════════════════════════════════ */}
      {tab === "projects" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#1a1a2e" }}>All Projects</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f7f8fc" }}>
                {["Project","Customer","Status","Rate/hr","Budget","Logged Hrs","Time Cost","Expenses","Variance",""].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 && <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>No projects</td></tr>}
              {projects.map(proj => {
                const logs = timeLogs.filter(l => l.project_id === proj.id);
                const exps = expenses.filter(e => e.project_id === proj.id);
                const totalH   = logs.reduce((s,l) => s + Number(l.hours), 0).toFixed(1);
                const timeCost = logs.filter(l=>l.billable).reduce((s,l) => s + Number(l.hours) * Number(l.hourly_rate||proj.hourly_rate||1500), 0);
                const expCost  = exps.filter(e=>e.billable).reduce((s,e) => s + Number(e.amount), 0);
                const budget   = Number(proj.budget);
                const variance = budget - timeCost - expCost;
                const varColor = variance >= 0 ? "#34a853" : "#ea4335";
                return (
                  <tr key={proj.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 12px", color: "#1a73e8", fontWeight: 600 }}>{proj.name}</td>
                    <td style={{ padding: "12px 12px" }}>{proj.customer_name||"-"}</td>
                    <td style={{ padding: "12px 12px" }}>
                      <Badge label={proj.status} color={proj.status==="Active"?"#34a853":"#888"} />
                    </td>
                    <td style={{ padding: "12px 12px", color: "#555" }}>₹{Number(proj.hourly_rate||1500).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 12px" }}>₹{budget.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 12px", fontWeight: 600 }}>{totalH}h</td>
                    <td style={{ padding: "12px 12px", color: "#1a73e8" }}>₹{timeCost.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 12px", color: "#ff6d00" }}>₹{expCost.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 12px", fontWeight: 700, color: varColor }}>
                      {variance >= 0 ? "+" : ""}₹{Math.abs(variance).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <button onClick={() => loadProfitability(proj.id)} style={{ padding: "4px 10px", borderRadius: 6, background: "#1a73e818", color: "#1a73e8", border: "1px solid #1a73e8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📊 Details</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add/Edit Log */}
      <Modal open={showLogModal} title={editLog ? "Edit Time Log" : "Log Time Manually"} onClose={() => setShowLogModal(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Project *</label>
              <select value={logForm.projectId} onChange={e => setLogForm(f=>({...f, projectId: e.target.value}))} style={inputStyle}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.hourly_rate}/hr)</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={logForm.date} onChange={e => setLogForm(f=>({...f, date: e.target.value}))} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Task Description *</label>
            <input value={logForm.task} onChange={e => setLogForm(f=>({...f, task: e.target.value}))} placeholder="e.g. UI Design, API Integration" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Hours *</label>
              <input type="number" min="0.25" step="0.25" value={logForm.hours} onChange={e => setLogForm(f=>({...f, hours: e.target.value}))} placeholder="e.g. 2.5" style={inputStyle} />
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="billable" checked={logForm.billable} onChange={e => setLogForm(f=>({...f, billable: e.target.checked}))} />
              <label htmlFor="billable" style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Billable</label>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <input value={logForm.notes} onChange={e => setLogForm(f=>({...f, notes: e.target.value}))} placeholder="Optional notes" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setShowLogModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd", background: "none", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button onClick={saveLog} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{editLog ? "Update" : "Save Log"}</button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Expense */}
      <Modal open={showExpenseModal} title={editExpense ? "Edit Expense" : "Add Project Expense"} onClose={() => setShowExpenseModal(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Project *</label>
              <select value={expForm.projectId} onChange={e => setExpForm(f=>({...f, projectId: e.target.value}))} style={inputStyle}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={expForm.expense_date} onChange={e => setExpForm(f=>({...f, expense_date: e.target.value}))} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Category</label>
              <select value={expForm.category} onChange={e => setExpForm(f=>({...f, category: e.target.value}))} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Amount (₹) *</label>
              <input type="number" value={expForm.amount} onChange={e => setExpForm(f=>({...f, amount: e.target.value}))} placeholder="e.g. 5000" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description *</label>
            <input value={expForm.description} onChange={e => setExpForm(f=>({...f, description: e.target.value}))} placeholder="e.g. AWS subscription for project" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Receipt URL (optional)</label>
              <input value={expForm.receipt_url} onChange={e => setExpForm(f=>({...f, receipt_url: e.target.value}))} placeholder="https://..." style={inputStyle} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="expbill" checked={expForm.billable} onChange={e => setExpForm(f=>({...f, billable: e.target.checked}))} />
              <label htmlFor="expbill" style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Billable</label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setShowExpenseModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd", background: "none", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button onClick={saveExpense} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#ff6d00", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{editExpense ? "Update" : "Add Expense"}</button>
          </div>
        </div>
      </Modal>

      {/* New Retainer */}
      <Modal open={showRetainerModal} title="New Retainer Invoice" onClose={() => setShowRetainerModal(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Project *</label>
            <select value={retForm.projectId} onChange={e => setRetForm(f=>({...f, projectId: e.target.value}))} style={inputStyle}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Retainer Amount (₹) *</label>
            <input type="number" value={retForm.amount} onChange={e => setRetForm(f=>({...f, amount: e.target.value}))} placeholder="e.g. 50000" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Period Start</label>
              <input type="date" value={retForm.period_start} onChange={e => setRetForm(f=>({...f, period_start: e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Period End</label>
              <input type="date" value={retForm.period_end} onChange={e => setRetForm(f=>({...f, period_end: e.target.value}))} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <input value={retForm.notes} onChange={e => setRetForm(f=>({...f, notes: e.target.value}))} placeholder="e.g. Monthly retainer for support" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setShowRetainerModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd", background: "none", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button onClick={saveRetainer} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#9c27b0", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Create Retainer</button>
          </div>
        </div>
      </Modal>

      {/* New Project */}
      <Modal open={showProjectModal} title="New Project" onClose={() => setShowProjectModal(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Project Name *</label>
            <input value={projForm.name} onChange={e => setProjForm(f=>({...f, name: e.target.value}))} placeholder="e.g. Website Redesign" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Customer *</label>
            <select value={projForm.customerId} onChange={e => setProjForm(f=>({...f, customerId: e.target.value}))} style={inputStyle}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select value={projForm.status} onChange={e => setProjForm(f=>({...f, status: e.target.value}))} style={inputStyle}>
                <option>Active</option><option>Completed</option><option>On Hold</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Hourly Rate (₹) *</label>
              <input type="number" value={projForm.hourly_rate} onChange={e => setProjForm(f=>({...f, hourly_rate: e.target.value}))} placeholder="1500" style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Budget (₹)</label>
            <input type="number" value={projForm.budget} onChange={e => setProjForm(f=>({...f, budget: e.target.value}))} placeholder="e.g. 100000" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setShowProjectModal(false)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd", background: "none", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button onClick={saveProject} style={{ padding: "9px 24px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Create Project</button>
          </div>
        </div>
      </Modal>

      {/* Profitability Modal */}
      <Modal open={!!profData} title={`📊 Profitability — ${profData?.project_name}`} onClose={() => setProfData(null)} width={480}>
        {profData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Budget",             value: `₹${Number(profData.budget).toLocaleString("en-IN")}`,        color: "#1a73e8" },
              { label: "Time Cost (billable)",value: `₹${Number(profData.time_cost).toLocaleString("en-IN")}`,    color: "#1a73e8" },
              { label: "Expense Cost (billable)",value:`₹${Number(profData.expense_cost).toLocaleString("en-IN")}`,color:"#ff6d00"},
              { label: "Total Actual",        value: `₹${Number(profData.total_actual).toLocaleString("en-IN")}`, color: "#333" },
              { label: "Retainer Received",   value: `₹${Number(profData.retainer_received).toLocaleString("en-IN")}`, color: "#9c27b0" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ color: "#555", fontSize: 14 }}>{row.label}</span>
                <span style={{ fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderRadius: 10, background: profData.profitable ? "#34a85312" : "#ea433512", marginTop: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: profData.profitable ? "#34a853" : "#ea4335" }}>
                {profData.profitable ? "✅ Under Budget" : "⚠️ Over Budget"}
              </span>
              <span style={{ fontWeight: 700, fontSize: 15, color: profData.profitable ? "#34a853" : "#ea4335" }}>
                {profData.variance >= 0 ? "+" : ""}₹{Math.abs(Number(profData.variance)).toLocaleString("en-IN")} ({profData.variance_pct}%)
              </span>
            </div>
            <button onClick={() => setProfData(null)} style={{ alignSelf: "flex-end", padding: "9px 24px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!showDeleteId} title="Delete?" onClose={() => setShowDeleteId(null)} width={400}>
        <p style={{ color: "#555", fontSize: 14 }}>This cannot be undone. Delete this {deleteType}?</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => setShowDeleteId(null)} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd", background: "none", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => deleteType === "log" ? deleteLog(showDeleteId) : deleteExpense(showDeleteId)}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#ea4335", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Delete</button>
        </div>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
