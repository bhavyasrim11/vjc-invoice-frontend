import { useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Divider, IconButton, Alert, Tooltip, Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import StopIcon from "@mui/icons-material/Stop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RepeatIcon from "@mui/icons-material/Repeat";

// ─── Helpers ────────────────────────────────────────────────
const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  });

const today = () => new Date().toISOString().split("T")[0];

const formatDate = (dateStr) => {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// Calculate next invoice date based on frequency
const calcNextDate = (lastDate, frequency) => {
  if (!lastDate) return null;
  const d = new Date(lastDate);
  switch (frequency) {
    case "Weekly":     d.setDate(d.getDate() + 7);    break;
    case "Monthly":    d.setMonth(d.getMonth() + 1);  break;
    case "Quarterly":  d.setMonth(d.getMonth() + 3);  break;
    case "HalfYearly": d.setMonth(d.getMonth() + 6);  break;
    case "Yearly":     d.setFullYear(d.getFullYear() + 1); break;
    default: break;
  }
  return d.toISOString().split("T")[0];
};

// ─── Config ──────────────────────────────────────────────────
const FREQUENCIES = [
  { key: "Weekly",     label: "Weekly" },
  { key: "Monthly",   label: "Monthly" },
  { key: "Quarterly", label: "Quarterly" },
  { key: "HalfYearly",label: "Half Yearly" },
  { key: "Yearly",    label: "Yearly" },
];

const PAYMENT_TERMS = [
  "Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt",
];

const STATUS_COLOR = {
  Active:  "success",
  Stopped: "error",
  Expired: "warning",
};

// ─── Seed Data ───────────────────────────────────────────────
const CUSTOMERS = [
  { id: "CUS001", name: "Rahul Kumar",  company: "ABC Pvt Ltd",   email: "rahul@gmail.com" },
  { id: "CUS002", name: "Priya Reddy",  company: "XYZ Solutions", email: "priya@gmail.com" },
  { id: "CUS003", name: "Vikram Singh", company: "Tech Corp",     email: "vikram@gmail.com" },
];

const ITEMS_LIST = [
  { id: 1, serviceName: "Canada Study Visa",    price: 150000, gst: 18 },
  { id: 2, serviceName: "Australia PR",          price: 250000, gst: 18 },
  { id: 3, serviceName: "UK Tourist Visa",       price: 65000,  gst: 18 },
  { id: 4, serviceName: "Monthly Consultation",  price: 10000,  gst: 18 },
  { id: 5, serviceName: "Document Processing",   price: 25000,  gst: 18 },
];

const emptyLineItem = () => ({
  _key: Date.now() + Math.random(),
  itemId: "",
  description: "",
  qty: 1,
  rate: 0,
  gst: 18,
  discount: 0,
});

// ─── Line item calculation ────────────────────────────────────
const lineAmount = (li) => {
  const base    = li.qty * li.rate;
  const disc    = base * (li.discount / 100);
  const taxable = base - disc;
  const gstAmt  = taxable * (li.gst / 100);
  return { taxable, gstAmt, total: taxable + gstAmt };
};

const totals = (lineItems) => {
  let subTotal = 0, totalGST = 0, grandTotal = 0;
  lineItems.forEach((li) => {
    const a = lineAmount(li);
    subTotal   += a.taxable;
    totalGST   += a.gstAmt;
    grandTotal += a.total;
  });
  return { subTotal, totalGST, grandTotal };
};

// ─── View Generated Invoices Dialog ──────────────────────────
function GeneratedInvoicesDialog({ open, onClose, profile }) {
  if (!profile) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: "#1976d2", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Generated Invoices — {profile.profileName}
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {profile.generatedInvoices?.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  {["Invoice #", "Date", "Amount", "Status"].map(h => (
                    <TableCell key={h}><strong>{h}</strong></TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {profile.generatedInvoices.map((inv, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ color: "#1976d2", fontWeight: "bold" }}>{inv.id}</TableCell>
                    <TableCell>{formatDate(inv.date)}</TableCell>
                    <TableCell><strong>{formatPrice(inv.amount)}</strong></TableCell>
                    <TableCell>
                      <Chip label={inv.status} size="small"
                        color={inv.status === "Paid" ? "success" : inv.status === "Sent" ? "primary" : "default"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No invoices generated yet for this profile.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── View Profile Dialog ──────────────────────────────────────
function ViewProfileDialog({ open, onClose, profile, onStop, onResume }) {
  if (!profile) return null;
  const { subTotal, totalGST, grandTotal } = totals(profile.lineItems || []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: "#1976d2", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Recurring Profile — {profile.profileName}
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {/* Status banner */}
        <Alert
          severity={profile.status === "Active" ? "success" : profile.status === "Stopped" ? "error" : "warning"}
          sx={{ mb: 2 }}
          action={
            profile.status === "Active" ? (
              <Button size="small" color="error" startIcon={<StopIcon />}
                onClick={() => { onStop(profile); onClose(); }}>
                Stop
              </Button>
            ) : profile.status === "Stopped" ? (
              <Button size="small" color="success" startIcon={<PlayArrowIcon />}
                onClick={() => { onResume(profile); onClose(); }}>
                Resume
              </Button>
            ) : null
          }
        >
          Status: <strong>{profile.status}</strong>
          {profile.status === "Active" && ` — Next invoice on ${formatDate(profile.nextInvoiceDate)}`}
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">Profile Name</Typography>
            <Typography fontWeight="bold">{profile.profileName}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">Customer</Typography>
            <Typography fontWeight="bold">{profile.customerName}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">Frequency</Typography>
            <Typography>{profile.frequency}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">Payment Terms</Typography>
            <Typography>{profile.paymentTerms}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">Start Date</Typography>
            <Typography>{formatDate(profile.startDate)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">End Date</Typography>
            <Typography>{profile.endDate ? formatDate(profile.endDate) : "No end date"}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">Last Invoice Date</Typography>
            <Typography>{formatDate(profile.lastInvoiceDate)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography color="text.secondary" variant="body2">Next Invoice Date</Typography>
            <Typography sx={{ color: profile.status === "Active" ? "#2e7d32" : "inherit", fontWeight: "bold" }}>
              {profile.status === "Active" ? formatDate(profile.nextInvoiceDate) : "--"}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Line items */}
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Services / Items</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                {["Item", "Qty", "Rate", "Discount", "GST", "Amount"].map(h => (
                  <TableCell key={h}><strong>{h}</strong></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {(profile.lineItems || []).map((li) => {
                const amt = lineAmount(li);
                return (
                  <TableRow key={li._key}>
                    <TableCell>{li.description}</TableCell>
                    <TableCell>{li.qty}</TableCell>
                    <TableCell>{formatPrice(li.rate)}</TableCell>
                    <TableCell>{li.discount}%</TableCell>
                    <TableCell>{li.gst}%</TableCell>
                    <TableCell><strong>{formatPrice(amt.total)}</strong></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Totals */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Box sx={{ width: 300, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Sub Total</Typography><Typography>{formatPrice(subTotal)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>GST</Typography><Typography>{formatPrice(totalGST)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight="bold">Total (per cycle)</Typography>
              <Typography fontWeight="bold" color="primary">{formatPrice(grandTotal)}</Typography>
            </Box>
          </Box>
        </Box>

        {profile.notes && (
          <Box sx={{ mt: 2 }}>
            <Typography color="text.secondary" variant="body2" fontWeight="bold">Notes</Typography>
            <Typography>{profile.notes}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Create / Edit Dialog ─────────────────────────────────────
function ProfileFormDialog({ open, onClose, onSave, editData }) {
  const isEdit = !!editData;

  const [form, setForm] = useState(editData || {
    profileName: "",
    customerId: "",
    customerName: "",
    frequency: "Monthly",
    paymentTerms: "Net 30",
    startDate: today(),
    endDate: "",
    noEndDate: true,
    lineItems: [emptyLineItem()],
    notes: "",
  });

  // Sync when editData changes
  useState(() => {
    if (editData) setForm(editData);
  }, [editData]);

  const updateLine = (key, field, value) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li) => {
        if (li._key !== key) return li;
        const updated = { ...li, [field]: value };
        if (field === "itemId") {
          const found = ITEMS_LIST.find((i) => i.id === Number(value));
          if (found) {
            updated.description = found.serviceName;
            updated.rate        = found.price;
            updated.gst         = found.gst;
          }
        }
        return updated;
      }),
    }));
  };

  const addLine    = () => setForm((f) => ({ ...f, lineItems: [...f.lineItems, emptyLineItem()] }));
  const removeLine = (key) => setForm((f) => ({ ...f, lineItems: f.lineItems.filter((l) => l._key !== key) }));

  const { subTotal, totalGST, grandTotal } = totals(form.lineItems);

  const handleSave = () => {
    if (!form.customerId || !form.profileName) return;
    onSave(form, isEdit);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ bgcolor: "#1976d2", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {isEdit ? `Edit Profile — ${form.profileName}` : "New Recurring Invoice Profile"}
        <IconButton size="small" onClick={onClose} sx={{ color: "white" }}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 1 }}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>

          {/* Profile Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Profile Name *"
              value={form.profileName}
              onChange={(e) => setForm({ ...form, profileName: e.target.value })}
              placeholder="e.g. Monthly Consultation — Rahul"
            />
          </Grid>

          {/* Customer */}
          <Grid item xs={12} md={6}>
            <TextField
              select fullWidth label="Customer *"
              value={form.customerId}
              onChange={(e) => {
                const c = CUSTOMERS.find(x => x.id === e.target.value);
                setForm({ ...form, customerId: e.target.value, customerName: c?.name || "" });
              }}
            >
              {CUSTOMERS.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name} — {c.company}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Frequency */}
          <Grid item xs={12} md={4}>
            <TextField
              select fullWidth label="Frequency *"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            >
              {FREQUENCIES.map((f) => (
                <MenuItem key={f.key} value={f.key}>{f.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Payment Terms */}
          <Grid item xs={12} md={4}>
            <TextField
              select fullWidth label="Payment Terms"
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
            >
              {PAYMENT_TERMS.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth label="Start Date *" type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.noEndDate}
                  onChange={(e) => setForm({ ...form, noEndDate: e.target.checked, endDate: "" })}
                />
              }
              label="No End Date (runs indefinitely)"
            />
          </Grid>

          {!form.noEndDate && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="End Date" type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          )}
        </Grid>

        {/* ── Item Table ── */}
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Items / Services</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell width="25%"><strong>Item</strong></TableCell>
                <TableCell width="20%"><strong>Description</strong></TableCell>
                <TableCell width="8%"><strong>Qty</strong></TableCell>
                <TableCell width="12%"><strong>Rate (₹)</strong></TableCell>
                <TableCell width="8%"><strong>Disc %</strong></TableCell>
                <TableCell width="8%"><strong>GST %</strong></TableCell>
                <TableCell width="12%"><strong>Amount</strong></TableCell>
                <TableCell width="7%"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.lineItems.map((li) => {
                const amt = lineAmount(li);
                return (
                  <TableRow key={li._key}>
                    <TableCell>
                      <TextField
                        select fullWidth size="small" value={li.itemId}
                        onChange={(e) => updateLine(li._key, "itemId", e.target.value)}
                      >
                        <MenuItem value="">-- Select --</MenuItem>
                        {ITEMS_LIST.map((it) => (
                          <MenuItem key={it.id} value={it.id}>{it.serviceName}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" fullWidth value={li.description}
                        onChange={(e) => updateLine(li._key, "description", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={li.qty} sx={{ width: 60 }}
                        onChange={(e) => updateLine(li._key, "qty", Number(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={li.rate} sx={{ width: 90 }}
                        onChange={(e) => updateLine(li._key, "rate", Number(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={li.discount} sx={{ width: 60 }}
                        onChange={(e) => updateLine(li._key, "discount", Number(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={li.gst} sx={{ width: 60 }}
                        onChange={(e) => updateLine(li._key, "gst", Number(e.target.value))} />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold">{formatPrice(amt.total)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        GST: {formatPrice(amt.gstAmt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error"
                        onClick={() => removeLine(li._key)}
                        disabled={form.lineItems.length === 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Button startIcon={<AddIcon />} sx={{ mt: 1 }} onClick={addLine}>
          Add New Row
        </Button>

        {/* Totals */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Box sx={{ width: 320, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Sub Total</Typography><Typography>{formatPrice(subTotal)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>GST</Typography><Typography>{formatPrice(totalGST)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight="bold" variant="h6">Total per cycle (₹)</Typography>
              <Typography fontWeight="bold" variant="h6" color="primary">
                {formatPrice(grandTotal)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Notes */}
        <TextField
          fullWidth multiline rows={2} label="Notes" sx={{ mt: 2 }}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          helperText="Internal notes for this recurring profile"
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!form.customerId || !form.profileName}
          startIcon={<RepeatIcon />}
        >
          {isEdit ? "Update Profile" : "Create Recurring Profile"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────
function RecurringInvoices() {
  const [profiles, setProfiles] = useState([
    {
      id: "REC-000001",
      profileName: "Recurring Invoice 1",
      customerId: "CUS001",
      customerName: "Rahul Kumar",
      frequency: "Monthly",
      paymentTerms: "Net 45",
      startDate: "2025-01-01",
      endDate: "",
      noEndDate: true,
      lastInvoiceDate: "2025-08-14",
      nextInvoiceDate: "2027-05-05",
      status: "Active",
      notes: "",
      lineItems: [
        { _key: 1, itemId: 4, description: "Monthly Consultation", qty: 1, rate: 10000, gst: 18, discount: 0 },
      ],
      generatedInvoices: [
        { id: "INV-AUTO-001", date: "2025-01-01", amount: 11800, status: "Paid" },
        { id: "INV-AUTO-002", date: "2025-02-01", amount: 11800, status: "Paid" },
        { id: "INV-AUTO-003", date: "2025-08-14", amount: 11800, status: "Sent" },
      ],
    },
    {
      id: "REC-000002",
      profileName: "Recurring Invoice 2",
      customerId: "CUS002",
      customerName: "Priya Reddy",
      frequency: "Monthly",
      paymentTerms: "Net 60",
      startDate: "2025-01-01",
      endDate: "",
      noEndDate: true,
      lastInvoiceDate: "2025-08-14",
      nextInvoiceDate: "",
      status: "Stopped",
      notes: "Customer requested to pause.",
      lineItems: [
        { _key: 2, itemId: 5, description: "Document Processing", qty: 1, rate: 25000, gst: 18, discount: 0 },
      ],
      generatedInvoices: [
        { id: "INV-AUTO-004", date: "2025-01-01", amount: 29500, status: "Paid" },
        { id: "INV-AUTO-005", date: "2025-08-14", amount: 29500, status: "Paid" },
      ],
    },
    {
      id: "REC-000003",
      profileName: "Recurring Invoice 3",
      customerId: "CUS003",
      customerName: "Vikram Singh",
      frequency: "Quarterly",
      paymentTerms: "Due on Receipt",
      startDate: "2025-01-01",
      endDate: "",
      noEndDate: true,
      lastInvoiceDate: "2025-08-14",
      nextInvoiceDate: "2027-05-05",
      status: "Active",
      notes: "",
      lineItems: [
        { _key: 3, itemId: 3, description: "UK Tourist Visa", qty: 1, rate: 65000, gst: 18, discount: 5 },
      ],
      generatedInvoices: [
        { id: "INV-AUTO-006", date: "2025-01-01", amount: 72923, status: "Paid" },
        { id: "INV-AUTO-007", date: "2025-08-14", amount: 72923, status: "Draft" },
      ],
    },
  ]);

  // ── UI State ──
  const [formOpen, setFormOpen]             = useState(false);
  const [viewOpen, setViewOpen]             = useState(false);
  const [genInvOpen, setGenInvOpen]         = useState(false);
  const [selected, setSelected]             = useState(null);
  const [editData, setEditData]             = useState(null);
  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("All");

  // ── Next Profile Number ──
  const nextProfileNo = () => {
    const nums = profiles.map((p) => parseInt(p.id.replace("REC-", ""), 10));
    const max  = nums.length ? Math.max(...nums) : 0;
    return `REC-${String(max + 1).padStart(6, "0")}`;
  };

  // ── Save Profile (Create / Edit) ──
  const handleSave = (form, isEdit) => {
    const nextDate = calcNextDate(form.startDate, form.frequency);
    if (isEdit) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === form.id
            ? { ...form, nextInvoiceDate: form.status === "Active" ? nextDate : "" }
            : p
        )
      );
    } else {
      const newProfile = {
        ...form,
        id: nextProfileNo(),
        status: "Active",
        lastInvoiceDate: form.startDate,
        nextInvoiceDate: nextDate,
        generatedInvoices: [],
      };
      setProfiles((prev) => [...prev, newProfile]);
    }
  };

  // ── Stop Profile ──
  const handleStop = (profile) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profile.id ? { ...p, status: "Stopped", nextInvoiceDate: "" } : p
      )
    );
  };

  // ── Resume Profile ──
  const handleResume = (profile) => {
    const nextDate = calcNextDate(profile.lastInvoiceDate, profile.frequency);
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profile.id ? { ...p, status: "Active", nextInvoiceDate: nextDate } : p
      )
    );
  };

  // ── Delete Profile ──
  const handleDelete = (profile) => {
    if (!window.confirm(`"${profile.profileName}" delete చేయాలా?`)) return;
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
  };

  // ── Filter ──
  const filtered = profiles.filter((p) => {
    const matchSearch =
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.profileName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ──
  const activeCount  = profiles.filter(p => p.status === "Active").length;
  const stoppedCount = profiles.filter(p => p.status === "Stopped").length;
  const totalGenInv  = profiles.reduce((s, p) => s + (p.generatedInvoices?.length || 0), 0);
  const totalValue   = profiles.reduce((s, p) => {
    const { grandTotal } = totals(p.lineItems || []);
    return s + grandTotal;
  }, 0);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Recurring Invoices</Typography>

      {/* ── Stats ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Profiles",      value: profiles.length,        color: "#1976d2" },
          { label: "Active",              value: activeCount,             color: "#2e7d32" },
          { label: "Stopped",             value: stoppedCount,            color: "#d32f2f" },
          { label: "Invoices Generated",  value: totalGenInv,             color: "#7b1fa2" },
          { label: "Total Value / Cycle", value: formatPrice(totalValue), color: "#ed6c02" },
        ].map((s) => (
          <Grid item xs={12} md={2.4} key={s.label}>
            <Card sx={{ borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography color="text.secondary" variant="body2">{s.label}</Typography>
                <Typography variant="h6" fontWeight="bold">{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Search + Filter + New ── */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="Search Profile / Customer"
          size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
        />
        <TextField
          select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 160 }}
        >
          {["All", "Active", "Stopped", "Expired"].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained" startIcon={<AddIcon />}
          onClick={() => { setEditData(null); setFormOpen(true); }}
        >
          + New
        </Button>
      </Box>

      {/* ── Table ── */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {["Customer Name", "Profile Name", "Frequency", "Last Invoice Date", "Next Invoice Date", "Status", "Actions"].map((h) => (
                <TableCell key={h}><strong>{h}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.customerName}</TableCell>
                <TableCell>
                  <Typography
                    sx={{ color: "#1976d2", fontWeight: "bold", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                    onClick={() => { setSelected(p); setViewOpen(true); }}
                  >
                    {p.profileName}
                  </Typography>
                </TableCell>
                <TableCell>{p.frequency}</TableCell>
                <TableCell>{formatDate(p.lastInvoiceDate)}</TableCell>
                <TableCell>
                  <Typography
                    sx={{ color: p.status === "Active" ? "#2e7d32" : "text.secondary", fontWeight: p.status === "Active" ? "bold" : "normal" }}
                  >
                    {p.status === "Active" ? formatDate(p.nextInvoiceDate) : "--"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.status}
                    color={STATUS_COLOR[p.status] || "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {/* View */}
                    <Tooltip title="View Profile">
                      <IconButton size="small" color="primary"
                        onClick={() => { setSelected(p); setViewOpen(true); }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Edit */}
                    <Tooltip title="Edit Profile">
                      <IconButton size="small" color="default"
                        onClick={() => { setEditData({ ...p }); setFormOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Generated Invoices */}
                    <Tooltip title="View Generated Invoices">
                      <IconButton size="small" color="secondary"
                        onClick={() => { setSelected(p); setGenInvOpen(true); }}>
                        <ReceiptLongIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Stop / Resume */}
                    {p.status === "Active" ? (
                      <Tooltip title="Stop Recurring">
                        <IconButton size="small" color="error" onClick={() => handleStop(p)}>
                          <StopIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : p.status === "Stopped" ? (
                      <Tooltip title="Resume Recurring">
                        <IconButton size="small" color="success" onClick={() => handleResume(p)}>
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}

                    {/* Delete */}
                    <Tooltip title="Delete Profile">
                      <IconButton size="small" color="error" onClick={() => handleDelete(p)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── CREATE / EDIT DIALOG ── */}
      <ProfileFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSave={handleSave}
        editData={editData}
      />

      {/* ── VIEW PROFILE DIALOG ── */}
      <ViewProfileDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        profile={selected}
        onStop={handleStop}
        onResume={handleResume}
      />

      {/* ── GENERATED INVOICES DIALOG ── */}
      <GeneratedInvoicesDialog
        open={genInvOpen}
        onClose={() => setGenInvOpen(false)}
        profile={selected}
      />
    </Box>
  );
}

export default RecurringInvoices;