import { useState, useEffect } from "react";
import {
  Box, Typography, Button, TextField, MenuItem, Grid,
  Paper, Chip, Avatar, Divider, CircularProgress, Alert,
  IconButton, Checkbox,
} from "@mui/material";
import PersonAddIcon     from "@mui/icons-material/PersonAdd";
import GroupsIcon        from "@mui/icons-material/Groups";
import EditIcon          from "@mui/icons-material/Edit";
import SaveIcon          from "@mui/icons-material/Save";
import CloseIcon         from "@mui/icons-material/Close";
import VisibilityIcon    from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const API = "https://vjc-invoice-backend.vercel.app/api";

const DEPARTMENTS = ["Sales", "Operations", "Accounts", "HR", "Marketing", "Management", "MIS", "Developer"];
const ROLES       = ["employee", "manager", "mis-executive", "Full-Stack-Developer"];
const LOCATIONS   = ["Hyderabad", "Bangalore"];

const ALL_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard",         icon: "🏠" },
  { key: "customers", label: "Customers",         icon: "👤" },
  { key: "invoices",  label: "Invoices",          icon: "🧾" },
  { key: "quotes",    label: "Quotes",            icon: "📋" },
  { key: "payments",  label: "Payments Received", icon: "💰" },
  { key: "expenses",  label: "Expenses",          icon: "💸" },
  { key: "reports",   label: "Reports",           icon: "📊" },
  { key: "services",  label: "Services",          icon: "🛠️" },
  { key: "leads",     label: "Lead Management",   icon: "🎯" },
];

function roleStyle(role) {
  if (role === "manager")              return { bg: "#fef3c7", color: "#92400e", border: "#fde68a" };
  if (role === "mis-executive")        return { bg: "#fce7f3", color: "#9d174d", border: "#fbcfe8" };
  if (role === "Full-Stack-Developer") return { bg: "#e0f2fe", color: "#075985", border: "#bae6fd" };
  return                                      { bg: "#ede9fe", color: "#4c1d95", border: "#ddd6fe" };
}

// ── Employee Card ─────────────────────────────────────────────
function EmployeeCard({ emp, onDeactivate, onRefresh }) {
  const [showPerms,    setShowPerms]    = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [editError,    setEditError]    = useState("");

  const [form, setForm] = useState({
    name:         emp.name         || "",
    email:        emp.email        || "",
    department:   emp.department   || "",
    role:         emp.role         || "employee",
    location:     emp.location     || "Hyderabad",
    salary:       emp.salary       || "",
    bank_account: emp.bank_account || "",
    pan:          emp.pan          || "",
    ifsc:         emp.ifsc         || "",
    dob:          emp.dob          || "",
    doj:          emp.doj          || "",
    paid_leaves:  emp.paid_leaves  ?? "0",
    permissions:  emp.permissions  || {},
    new_password: "",   // ← NEW: blank by default, only sent if filled
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const togglePerm = (key) =>
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));

  const handleSave = async () => {
    setSaving(true);
    setEditError("");
    try {
      const token = localStorage.getItem("vjc_invoice_auth");

      // Only include new_password in payload if it was actually filled
      const payload = { ...form };
      if (!payload.new_password || payload.new_password.trim() === "") {
        delete payload.new_password;
      }

      const res = await fetch(`${API}/auth/employees/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { setEditing(false); onRefresh(); }
      else setEditError(data.message || "Failed to update");
    } catch {
      setEditError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name:         emp.name         || "",
      email:        emp.email        || "",
      department:   emp.department   || "",
      role:         emp.role         || "employee",
      location:     emp.location     || "Hyderabad",
      salary:       emp.salary       || "",
      bank_account: emp.bank_account || "",
      pan:          emp.pan          || "",
      ifsc:         emp.ifsc         || "",
      dob:          emp.dob          || "",
      doj:          emp.doj          || "",
      paid_leaves:  emp.paid_leaves  ?? "0",
      permissions:  emp.permissions  || {},
      new_password: "",
    });
    setEditError("");
    setEditing(false);
  };

  const permCount = ALL_PERMISSIONS.filter(p => (editing ? form.permissions : emp.permissions)?.[p.key]).length;
  const initials  = emp.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const isActive  = emp.status === "active";
  const rs        = roleStyle(editing ? form.role : emp.role);

  // ── inline field helper — WIDTH stays same, just replaces value ──
  const inlineText = (field, placeholder = "", type = "text") =>
    editing ? (
      <TextField
        fullWidth size="small" type={type}
        value={form[field]} onChange={set(field)}
        placeholder={placeholder}
        inputProps={{ autoComplete: "off" }}
        sx={{
          maxWidth: "100%",
          "& .MuiInputBase-root": { fontSize: 12 },
          "& .MuiInputBase-input": { fontSize: 12, py: 0.5, px: 1 },
        }}
      />
    ) : (
      <Typography variant="caption" fontWeight={700} color="#0f172a">
        {emp[field] || "—"}
      </Typography>
    );

  const inlineSelect = (field, options) =>
    editing ? (
      <TextField select fullWidth size="small" value={form[field]} onChange={set(field)}
        sx={{
          maxWidth: "100%",
          "& .MuiInputBase-root": { fontSize: 12 },
          "& .MuiInputBase-input": { fontSize: 12, py: 0.5, px: 1 },
        }}>
        {options.map(o => <MenuItem key={o} value={o} sx={{ fontSize: 12 }}>{o}</MenuItem>)}
      </TextField>
    ) : (
      <Typography variant="caption" fontWeight={700} color="#0f172a">
        {emp[field] || "—"}
      </Typography>
    );

  return (
    // ── KEY FIX: width: "100%" makes card fill the Grid cell exactly ──
    // The Grid item (xs=12 md=6 lg=4) controls width. Card just fills it.
    // overflow:hidden prevents ANY child from leaking outside.
    <Paper elevation={0} sx={{
      border: editing ? "2px solid #4f46e5" : "1px solid #e2e8f0",
      borderRadius: 3,
      overflow: "hidden",       // ← CRITICAL: nothing can push card wider
      width: "100%",            // ← fills Grid cell, never grows beyond it
      boxSizing: "border-box",  // ← border included in width calculation
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 4px 24px rgba(0,0,0,0.08)" },
    }}>
      {/* Top strip */}
      <Box sx={{ height: 4, bgcolor: editing ? "#4f46e5" : isActive ? "#16a34a" : "#e2e8f0" }} />

      <Box sx={{ p: 2.5 }}>

        {/* ── Avatar / Name / Email / Role ── */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2, minWidth: 0 }}>
          <Avatar sx={{ width: 46, height: 46, fontSize: 16, fontWeight: 800, bgcolor: "#4f46e5", flexShrink: 0 }}>
            {initials}
          </Avatar>

          {/* Name + Email block — minWidth:0 lets it shrink instead of pushing card wider */}
          <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            {editing ? (
              <TextField fullWidth size="small" value={form.name} onChange={set("name")}
                inputProps={{ autoComplete: "off" }}
                sx={{ mb: 0.5, "& .MuiInputBase-input": { fontSize: 14, fontWeight: 700, py: 0.5, px: 1 } }} />
            ) : (
              <Typography fontWeight={800} fontSize={15} noWrap>{emp.name}</Typography>
            )}
            {editing ? (
              <TextField fullWidth size="small" value={form.email} onChange={set("email")}
                inputProps={{ autoComplete: "off" }}
                sx={{ "& .MuiInputBase-input": { fontSize: 12, py: 0.5, px: 1 } }} />
            ) : (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                {emp.email}
              </Typography>
            )}
            {!editing && emp.department && (
              <Typography variant="caption" color="text.secondary">⇢ {emp.department}</Typography>
            )}
          </Box>

          {/* Role chip / select — flexShrink:0 keeps it from collapsing */}
          <Box sx={{ flexShrink: 0, maxWidth: 130 }}>
            {editing ? (
              <TextField select size="small" value={form.role} onChange={set("role")}
                sx={{ width: 120, "& .MuiInputBase-input": { fontSize: 11, py: 0.5, px: 0.8 } }}>
                {ROLES.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 12 }}>{r}</MenuItem>)}
              </TextField>
            ) : (
              <Chip label={emp.role} size="small" sx={{
                fontWeight: 700, fontSize: 11,
                bgcolor: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
              }} />
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* ── Detail rows ── */}
        {[
          { label: "Department",  field: "department",  type: "select", options: DEPARTMENTS },
          { label: "Location",    field: "location",    type: "select", options: LOCATIONS   },
          { label: "Salary (₹)",  field: "salary",      type: "number"                       },
          { label: "Employee ID", field: "employee_id", type: "static"                       },
        ].map(row => (
          <Box key={row.label} sx={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", mb: 0.8, gap: 1,
            minWidth: 0,   // ← prevents row from pushing card wider
          }}>
            <Typography variant="caption" fontWeight={600} sx={{ minWidth: 90, color: "#94a3b8", flexShrink: 0 }}>
              {row.label}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0, textAlign: "right" }}>
              {row.type === "static"
                ? <Typography variant="caption" fontWeight={700} sx={{ fontFamily: "monospace", color: "#4f46e5" }}>
                    {emp[row.field] || "—"}
                  </Typography>
                : row.type === "select"
                ? inlineSelect(row.field, row.options)
                : inlineText(row.field, "", row.type)}
            </Box>
          </Box>
        ))}

        {/* ── Password row ── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8, minWidth: 0 }}>
          <Typography variant="caption" fontWeight={600} sx={{ minWidth: 90, color: "#94a3b8", flexShrink: 0 }}>
            Password
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
            {editing ? (
              // ── NEW: editable password field in edit mode ──
              // Placeholder = "Leave blank to keep current"
              // Type toggles between password and text via eye icon
              <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 0.5 }}>
                <TextField
                  fullWidth size="small"
                  type={showPassword ? "text" : "password"}
                  value={form.new_password}
                  onChange={set("new_password")}
                  placeholder="Leave blank to keep current"
                  inputProps={{ autoComplete: "new-password" }}
                  sx={{ "& .MuiInputBase-input": { fontSize: 12, py: 0.5, px: 1 } }}
                />
                <IconButton size="small" onClick={() => setShowPassword(v => !v)} sx={{ p: 0.3, flexShrink: 0 }}>
                  {showPassword
                    ? <VisibilityOffIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
                    : <VisibilityIcon   sx={{ fontSize: 13, color: "#94a3b8" }} />}
                </IconButton>
              </Box>
            ) : (
              // ── View mode: show dots or plain password ──
              <>
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: showPassword ? 0 : 2, color: "#0f172a" }}>
                  {showPassword ? (emp.plain_password || "not available") : "••••••••"}
                </Typography>
                <IconButton size="small" onClick={() => setShowPassword(v => !v)} sx={{ p: 0.3 }}>
                  {showPassword
                    ? <VisibilityOffIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
                    : <VisibilityIcon   sx={{ fontSize: 13, color: "#94a3b8" }} />}
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* ── Edit / Save / Cancel buttons ── */}
        {!editing ? (
          <Button fullWidth size="small" variant="outlined"
            startIcon={<EditIcon sx={{ fontSize: 13 }} />}
            onClick={() => { setShowPassword(false); setEditing(true); }}
            sx={{ borderRadius: 2, fontSize: 12, fontWeight: 700, mb: 1.2, borderColor: "#e2e8f0", color: "#64748b" }}>
            Edit Details
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 1, mb: 1.2 }}>
            <Button fullWidth size="small" variant="outlined"
              startIcon={<CloseIcon sx={{ fontSize: 13 }} />}
              onClick={handleCancel}
              sx={{ borderRadius: 2, fontSize: 12 }}>
              Cancel
            </Button>
            <Button fullWidth size="small" variant="contained"
              startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <SaveIcon sx={{ fontSize: 13 }} />}
              onClick={handleSave} disabled={saving}
              sx={{ borderRadius: 2, fontSize: 12, bgcolor: "#4f46e5", "&:hover": { bgcolor: "#4338ca" } }}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </Box>
        )}

        {editError && <Alert severity="error" sx={{ mb: 1, fontSize: 12 }}>{editError}</Alert>}

        {/* ── Dashboard access accordion ── */}
        <Box onClick={() => setShowPerms(v => !v)} sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          p: 1.5, borderRadius: 2, bgcolor: "#f8fafc", border: "1px solid #e2e8f0",
          cursor: "pointer", mb: showPerms ? 1.2 : 0,
        }}>
          <Typography variant="caption" fontWeight={700} color="#64748b">
            🔐 Dashboard Access ({permCount}/{ALL_PERMISSIONS.length} sections)
          </Typography>
          <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>{showPerms ? "▲" : "▼"}</Typography>
        </Box>

        {showPerms && (
          <Box sx={{ mb: 1.2 }}>
            {/* Permissions grid — 2 columns, contained within card width */}
            <Grid container spacing={0.8} sx={{ mb: 1.5 }}>
              {ALL_PERMISSIONS.map(p => {
                const checked = !!(editing ? form.permissions : emp.permissions)?.[p.key];
                return (
                  <Grid item xs={6} key={p.key}>
                    <Box onClick={() => editing && togglePerm(p.key)} sx={{
                      display: "flex", alignItems: "center", gap: 0.8,
                      p: 0.8, borderRadius: 1.5,
                      cursor: editing ? "pointer" : "default",
                      border: `1.5px solid ${checked ? "#4f46e5" : "#e2e8f0"}`,
                      bgcolor: checked ? "#eef2ff" : "#fafafa",
                      minWidth: 0, overflow: "hidden",   // ← stay in grid cell
                    }}>
                      <Typography fontSize={13} sx={{ flexShrink: 0 }}>{p.icon}</Typography>
                      <Typography fontSize={10} fontWeight={600} flex={1}
                        color={checked ? "#3730a3" : "#374151"}
                        noWrap>
                        {p.label}
                      </Typography>
                      {editing && (
                        <Checkbox checked={checked} onChange={() => togglePerm(p.key)}
                          size="small" sx={{ p: 0, flexShrink: 0, color: checked ? "#4f46e5" : "#cbd5e1" }}
                          onClick={e => e.stopPropagation()} />
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Role assignment box */}
            <Box sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ display: "block", mb: 0.8 }}>
                🏷️ ROLE ASSIGNMENT
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Chip label={editing ? form.role : emp.role} size="small"
                  sx={{ bgcolor: rs.bg, color: rs.color, fontWeight: 700, fontSize: 11 }} />
                {(editing ? form.location : emp.location) && (
                  <Typography variant="caption" color="text.secondary">
                    ({editing ? form.location : emp.location})
                  </Typography>
                )}
                <Button size="small" color="error" variant="outlined"
                  onClick={() => onDeactivate(emp.id)}
                  disabled={!isActive}
                  sx={{ borderRadius: 1.5, fontSize: 11, fontWeight: 700, py: 0.2, px: 1, minWidth: 0, ml: "auto" }}>
                  {isActive ? "Remove" : "Removed"}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* ── Deactivate button (only when accordion is closed) ── */}
        {!showPerms && (
          <Button fullWidth size="small" color="error" variant="outlined"
            onClick={() => onDeactivate(emp.id)} disabled={!isActive}
            sx={{ borderRadius: 2, fontSize: 12, fontWeight: 700, mt: 1 }}>
            {isActive ? "Deactivate" : "Deactivated"}
          </Button>
        )}

      </Box>
    </Paper>
  );
}

// ── Main AllEmployees ─────────────────────────────────────────
function AllEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [tab,       setTab]       = useState("active");

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("vjc_invoice_auth");
      const res   = await fetch(`${API}/auth/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setEmployees(data.employees);
      else setError(data.message || "Failed to load");
    } catch {
      setError("Network error — could not load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const deactivate = async (id) => {
    if (!window.confirm("Deactivate this employee?")) return;
    const token = localStorage.getItem("vjc_invoice_auth");
    await fetch(`${API}/auth/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "inactive" }),
    });
    fetchEmployees();
  };

  const activeEmps   = employees.filter(e => e.status === "active");
  const inactiveEmps = employees.filter(e => e.status === "inactive");
  const displayed    = tab === "active" ? activeEmps : inactiveEmps;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">All Employees</Typography>
          <Typography variant="body2" color="text.secondary">
            {activeEmps.length} active · {inactiveEmps.length} inactive
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        {[
          { key: "active",   label: "✓ Active",   count: activeEmps.length,   color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
          { key: "inactive", label: "✕ Inactive", count: inactiveEmps.length, color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
        ].map(t => (
          <Box key={t.key} onClick={() => setTab(t.key)} sx={{
            px: 2.5, py: 1, borderRadius: 2, cursor: "pointer",
            border: `1.5px solid ${tab === t.key ? t.border : "#e2e8f0"}`,
            bgcolor: tab === t.key ? t.bg : "#fff",
            display: "flex", alignItems: "center", gap: 1,
            transition: "all 0.15s",
          }}>
            <Typography fontWeight={700} fontSize={13} color={tab === t.key ? t.color : "#94a3b8"}>
              {t.label}
            </Typography>
            <Chip label={t.count} size="small" sx={{
              height: 20, fontSize: 11, fontWeight: 700,
              bgcolor: tab === t.key ? t.color : "#e2e8f0",
              color:   tab === t.key ? "#fff"   : "#64748b",
            }} />
          </Box>
        ))}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : displayed.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <GroupsIcon sx={{ fontSize: 52, color: "#e2e8f0", mb: 1.5 }} />
          <Typography color="text.secondary" fontWeight={600}>No employees here</Typography>
          <Typography variant="caption" color="text.secondary">
            {tab === "active"
              ? 'Use "Add Employee" in the sidebar to create the first team member.'
              : "No inactive employees."}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {displayed.map((emp) => (
           <Grid item xs={12} md={6} lg={4} key={emp.id} sx={{ minWidth: 0 }}>
              <EmployeeCard emp={emp} onDeactivate={deactivate} onRefresh={fetchEmployees} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default AllEmployees;