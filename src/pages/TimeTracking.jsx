import { useState, useEffect, useRef } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { id: 1, name: "ABC Pvt Ltd" },
  { id: 2, name: "XYZ Solutions" },
  { id: 3, name: "Global Tech" },
];

const PROJECTS_INIT = [
  { id: 1, name: "Website Redesign", customerId: 1, status: "Active", budget: 50000 },
  { id: 2, name: "ERP Integration", customerId: 2, status: "Active", budget: 80000 },
  { id: 3, name: "Mobile App", customerId: 3, status: "Completed", budget: 120000 },
];

const TIME_LOGS_INIT = [
  { id: 1, projectId: 1, customerId: 1, date: "2026-06-01", task: "UI Design", hours: 3.5, billable: true, invoiced: false, notes: "Dashboard wireframes" },
  { id: 2, projectId: 1, customerId: 1, date: "2026-06-02", task: "Frontend Dev", hours: 5.0, billable: true, invoiced: false, notes: "React components" },
  { id: 3, projectId: 2, customerId: 2, date: "2026-06-03", task: "API Integration", hours: 4.0, billable: false, invoiced: false, notes: "REST endpoints" },
  { id: 4, projectId: 3, customerId: 3, date: "2026-06-04", task: "Testing", hours: 2.5, billable: true, invoiced: true, notes: "QA testing" },
];

const HOURLY_RATE = 1500; // ₹ per hour

// ─── Toast Component ──────────────────────────────────────────────────────────
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

// ─── Modal Component ──────────────────────────────────────────────────────────
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 28, minWidth: 480,
        maxWidth: 560, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
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

// ─── Live Timer Component ─────────────────────────────────────────────────────
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
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "18px 24px",
      flex: 1, minWidth: 140, boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      border: "1px solid #f0f0f0"
    }}>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || "#1a73e8" }}>{value}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TimeTracking() {
  const [tab, setTab] = useState("timeLogs"); // "timeLogs" | "projects"
  const [timeLogs, setTimeLogs] = useState(TIME_LOGS_INIT);
  const [projects, setProjects] = useState(PROJECTS_INIT);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProject, setTimerProject] = useState("");
  const [timerCustomer, setTimerCustomer] = useState("");
  const [timerTask, setTimerTask] = useState("");
  const [timerBillable, setTimerBillable] = useState(true);
  const timerRef = useRef(null);

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeleteId, setShowDeleteId] = useState(null);
  const [editLog, setEditLog] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterProject, setFilterProject] = useState("All");
  const [searchText, setSearchText] = useState("");

  // Toast
  const [toast, setToast] = useState("");

  // Log form
  const [logForm, setLogForm] = useState({
    projectId: "", customerId: "", date: new Date().toISOString().slice(0, 10),
    task: "", hours: "", billable: true, notes: ""
  });

  // Project form
  const [projForm, setProjForm] = useState({
    name: "", customerId: "", status: "Active", budget: ""
  });

  // ── Timer logic ──
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

  function stopTimer() {
    setTimerRunning(false);
    if (timerSeconds > 0) {
      const hrs = +(timerSeconds / 3600).toFixed(2);
      const proj = projects.find(p => p.id === +timerProject);
      const newLog = {
        id: Date.now(), projectId: +timerProject,
        customerId: proj ? proj.customerId : "",
        date: new Date().toISOString().slice(0, 10),
        task: timerTask || "Timer Entry", hours: hrs,
        billable: timerBillable, invoiced: false, notes: "Logged via timer"
      };
      setTimeLogs(prev => [newLog, ...prev]);
      setToast(`Time logged: ${hrs} hrs`);
      setTimerSeconds(0);
      setTimerTask("");
    }
  }

  function resetTimer() {
    setTimerRunning(false);
    setTimerSeconds(0);
  }

  // ── Log CRUD ──
  function openAddLog() {
    setEditLog(null);
    setLogForm({ projectId: "", customerId: "", date: new Date().toISOString().slice(0, 10), task: "", hours: "", billable: true, notes: "" });
    setShowLogModal(true);
  }

  function openEditLog(log) {
    setEditLog(log);
    setLogForm({ ...log });
    setShowLogModal(true);
  }

  function saveLog() {
    if (!logForm.projectId || !logForm.task || !logForm.hours) {
      setToast("Please fill all required fields!"); return;
    }
    const proj = projects.find(p => p.id === +logForm.projectId);
    if (editLog) {
      setTimeLogs(prev => prev.map(l => l.id === editLog.id ? { ...logForm, id: editLog.id, customerId: proj?.customerId || "" } : l));
      setToast("Time log updated!");
    } else {
      setTimeLogs(prev => [{ ...logForm, id: Date.now(), customerId: proj?.customerId || "", invoiced: false }, ...prev]);
      setToast("Time log added!");
    }
    setShowLogModal(false);
  }

  function deleteLog(id) {
    setTimeLogs(prev => prev.filter(l => l.id !== id));
    setShowDeleteId(null);
    setToast("Time log deleted!");
  }

  function convertToInvoice(log) {
    setTimeLogs(prev => prev.map(l => l.id === log.id ? { ...l, invoiced: true } : l));
    setToast(`INV created for ${log.task}!`);
  }

  // ── Project CRUD ──
  function saveProject() {
    if (!projForm.name || !projForm.customerId) { setToast("Fill required fields!"); return; }
    setProjects(prev => [...prev, { ...projForm, id: Date.now(), customerId: +projForm.customerId, budget: +projForm.budget || 0 }]);
    setProjForm({ name: "", customerId: "", status: "Active", budget: "" });
    setShowProjectModal(false);
    setToast("Project created!");
  }

  // ── Filtered logs ──
  const filteredLogs = timeLogs.filter(l => {
    const proj = projects.find(p => p.id === l.projectId);
    const cust = CUSTOMERS.find(c => c.id === l.customerId);
    const status = l.invoiced ? "Invoiced" : l.billable ? "Billable" : "Non Billable";
    if (filterStatus !== "All" && status !== filterStatus) return false;
    if (filterProject !== "All" && String(l.projectId) !== filterProject) return false;
    if (searchText && !`${l.task} ${proj?.name} ${cust?.name}`.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // ── Stats ──
  const totalHours = timeLogs.reduce((s, l) => s + +l.hours, 0).toFixed(1);
  const billableHours = timeLogs.filter(l => l.billable).reduce((s, l) => s + +l.hours, 0).toFixed(1);
  const billableAmount = (billableHours * HOURLY_RATE).toLocaleString("en-IN");
  const invoicedCount = timeLogs.filter(l => l.invoiced).length;

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: 7,
    border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box",
    outline: "none", marginTop: 4
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 2 };

  return (
    <div style={{ padding: "24px 28px", background: "#f7f8fc", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>

      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>Time Tracking</h2>
          <p style={{ margin: "4px 0 0", color: "#888", fontSize: 13 }}>Log time, manage projects, and convert billable hours to invoices</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowProjectModal(true)} style={{
            padding: "9px 18px", borderRadius: 8, border: "1px solid #1a73e8",
            background: "#fff", color: "#1a73e8", fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}>+ New Project</button>
          <button onClick={openAddLog} style={{
            padding: "9px 18px", borderRadius: 8, border: "none",
            background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}>+ Log Time</button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <StatCard label="Total Hours" value={`${totalHours} hrs`} color="#1a73e8" />
        <StatCard label="Billable Hours" value={`${billableHours} hrs`} color="#34a853" />
        <StatCard label="Billable Amount" value={`₹${billableAmount}`} color="#34a853" />
        <StatCard label="Invoiced" value={invoicedCount} color="#fbbc04" />
        <StatCard label="Active Projects" value={projects.filter(p => p.status === "Active").length} color="#1a73e8" />
      </div>

      {/* ── Live Timer Card ── */}
      <div style={{
        background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 22,
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0"
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "#1a1a2e" }}>
          ⏱ Log Time Using Timer
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Project *</label>
            <select value={timerProject} onChange={e => setTimerProject(e.target.value)} style={inputStyle}>
              <option value="">Select Project</option>
              {projects.filter(p => p.status === "Active").map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
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
            {!timerRunning ? (
              <button onClick={startTimer} style={{
                padding: "9px 20px", borderRadius: 8, background: "#34a853",
                color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer"
              }}>▶ Start</button>
            ) : (
              <button onClick={stopTimer} style={{
                padding: "9px 20px", borderRadius: 8, background: "#ea4335",
                color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer"
              }}>⏹ Stop & Save</button>
            )}
            <button onClick={resetTimer} style={{
              padding: "9px 14px", borderRadius: 8, background: "none",
              border: "1px solid #ddd", color: "#555", fontSize: 13, cursor: "pointer"
            }}>Reset</button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 18, borderBottom: "2px solid #e8eaf0" }}>
        {["timeLogs", "projects"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 22px", border: "none", background: "none",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
            color: tab === t ? "#1a73e8" : "#888",
            borderBottom: tab === t ? "2px solid #1a73e8" : "2px solid transparent",
            marginBottom: -2
          }}>
            {t === "timeLogs" ? "Time Logs" : "Projects"}
          </button>
        ))}
      </div>

      {/* ── TIME LOGS TAB ── */}
      {tab === "timeLogs" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          {/* Filters */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", flex: 1 }}>All Time Logs</span>
            <input
              placeholder="Search task, project, customer..."
              value={searchText} onChange={e => setSearchText(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, width: 220 }}
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
              <option>All</option>
              <option>Billable</option>
              <option>Non Billable</option>
              <option>Invoiced</option>
            </select>
            <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13 }}>
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f7f8fc" }}>
                  {["Log No", "Date", "Project", "Customer", "Task", "Hours", "Amount", "Status", "Workflow", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>No time logs found</td></tr>
                )}
                {filteredLogs.map((log, i) => {
                  const proj = projects.find(p => p.id === log.projectId);
                  const cust = CUSTOMERS.find(c => c.id === log.customerId);
                  const status = log.invoiced ? "Invoiced" : log.billable ? "Billable" : "Non Billable";
                  const statusColor = log.invoiced ? "#34a853" : log.billable ? "#1a73e8" : "#fbbc04";
                  const amount = log.billable ? `₹${(log.hours * HOURLY_RATE).toLocaleString("en-IN")}` : "-";
                  return (
                    <tr key={log.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 12px", color: "#1a73e8", fontWeight: 600 }}>TL-{String(i + 1).padStart(3, "0")}</td>
                      <td style={{ padding: "12px 12px", color: "#555" }}>{log.date}</td>
                      <td style={{ padding: "12px 12px", color: "#333" }}>{proj?.name || "-"}</td>
                      <td style={{ padding: "12px 12px", color: "#333" }}>{cust?.name || "-"}</td>
                      <td style={{ padding: "12px 12px", color: "#333" }}>{log.task}</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#1a1a2e" }}>{log.hours}h</td>
                      <td style={{ padding: "12px 12px", fontWeight: 600, color: "#34a853" }}>{amount}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{
                          background: `${statusColor}18`, color: statusColor,
                          padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
                        }}>{status}</span>
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        {!log.invoiced && log.billable ? (
                          <button onClick={() => convertToInvoice(log)} style={{
                            padding: "5px 12px", borderRadius: 6, background: "#1a73e818",
                            color: "#1a73e8", border: "1px solid #1a73e8", fontSize: 12,
                            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
                          }}>Convert to Invoice</button>
                        ) : log.invoiced ? (
                          <span style={{ color: "#34a853", fontSize: 12, fontWeight: 600 }}>✓ Invoiced</span>
                        ) : (
                          <span style={{ color: "#aaa", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 12px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => openEditLog(log)} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#fbbc04", fontSize: 16, padding: 4
                          }}>✎</button>
                          <button onClick={() => setShowDeleteId(log.id)} style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "#ea4335", fontSize: 16, padding: 4
                          }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, color: "#aaa", fontSize: 13 }}>
            Showing {filteredLogs.length} of {timeLogs.length} time logs
          </div>
        </div>
      )}

      {/* ── PROJECTS TAB ── */}
      {tab === "projects" && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#1a1a2e" }}>All Projects</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f7f8fc" }}>
                {["Project Name", "Customer", "Status", "Budget", "Logged Hours", "Billable Amount"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#888", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map(proj => {
                const cust = CUSTOMERS.find(c => c.id === proj.customerId);
                const logs = timeLogs.filter(l => l.projectId === proj.id);
                const totalH = logs.reduce((s, l) => s + +l.hours, 0).toFixed(1);
                const billAmt = logs.filter(l => l.billable).reduce((s, l) => s + l.hours * HOURLY_RATE, 0);
                return (
                  <tr key={proj.id} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 12px", color: "#1a73e8", fontWeight: 600 }}>{proj.name}</td>
                    <td style={{ padding: "12px 12px", color: "#333" }}>{cust?.name || "-"}</td>
                    <td style={{ padding: "12px 12px" }}>
                      <span style={{
                        background: proj.status === "Active" ? "#34a85318" : "#88888818",
                        color: proj.status === "Active" ? "#34a853" : "#888",
                        padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600
                      }}>{proj.status}</span>
                    </td>
                    <td style={{ padding: "12px 12px", color: "#333" }}>₹{(+proj.budget).toLocaleString("en-IN")}</td>
                    <td style={{ padding: "12px 12px", fontWeight: 600 }}>{totalH}h</td>
                    <td style={{ padding: "12px 12px", fontWeight: 600, color: "#34a853" }}>₹{billAmt.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add/Edit Log Modal ── */}
      <Modal open={showLogModal} title={editLog ? "Edit Time Log" : "Log Time Manually"} onClose={() => setShowLogModal(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Project *</label>
              <select value={logForm.projectId} onChange={e => {
                const proj = projects.find(p => p.id === +e.target.value);
                setLogForm(f => ({ ...f, projectId: e.target.value, customerId: proj?.customerId || "" }));
              }} style={inputStyle}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date *</label>
              <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Task Description *</label>
            <input value={logForm.task} onChange={e => setLogForm(f => ({ ...f, task: e.target.value }))} placeholder="e.g. UI Design, API Integration" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Hours *</label>
              <input type="number" min="0.25" step="0.25" value={logForm.hours} onChange={e => setLogForm(f => ({ ...f, hours: e.target.value }))} placeholder="e.g. 2.5" style={inputStyle} />
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, paddingTop: 20 }}>
              <input type="checkbox" id="billable" checked={logForm.billable} onChange={e => setLogForm(f => ({ ...f, billable: e.target.checked }))} />
              <label htmlFor="billable" style={{ fontSize: 14, fontWeight: 600, color: "#444" }}>Billable</label>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <input value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" style={inputStyle} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setShowLogModal(false)} style={{
              padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd",
              background: "none", color: "#555", fontSize: 14, cursor: "pointer"
            }}>Cancel</button>
            <button onClick={saveLog} style={{
              padding: "9px 24px", borderRadius: 8, border: "none",
              background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>{editLog ? "Update" : "Save Log"}</button>
          </div>
        </div>
      </Modal>

      {/* ── New Project Modal ── */}
      <Modal open={showProjectModal} title="New Project" onClose={() => setShowProjectModal(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Project Name *</label>
            <input value={projForm.name} onChange={e => setProjForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Customer *</label>
            <select value={projForm.customerId} onChange={e => setProjForm(f => ({ ...f, customerId: e.target.value }))} style={inputStyle}>
              <option value="">Select Customer</option>
              {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Status</label>
              <select value={projForm.status} onChange={e => setProjForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                <option>Active</option>
                <option>Completed</option>
                <option>On Hold</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Budget (₹)</label>
              <input type="number" value={projForm.budget} onChange={e => setProjForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. 50000" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button onClick={() => setShowProjectModal(false)} style={{
              padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd",
              background: "none", color: "#555", fontSize: 14, cursor: "pointer"
            }}>Cancel</button>
            <button onClick={saveProject} style={{
              padding: "9px 24px", borderRadius: 8, border: "none",
              background: "#1a73e8", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>Create Project</button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!showDeleteId} title="Delete Time Log?" onClose={() => setShowDeleteId(null)}>
        <p style={{ color: "#555", fontSize: 14 }}>This action cannot be undone. Are you sure you want to delete this time log?</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
          <button onClick={() => setShowDeleteId(null)} style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid #ddd",
            background: "none", color: "#555", fontSize: 14, cursor: "pointer"
          }}>Cancel</button>
          <button onClick={() => deleteLog(showDeleteId)} style={{
            padding: "9px 20px", borderRadius: 8, border: "none",
            background: "#ea4335", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer"
          }}>Delete</button>
        </div>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}