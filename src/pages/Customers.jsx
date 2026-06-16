import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Avatar, Tabs, Tab, Divider,
  Stack, CircularProgress, Alert
} from "@mui/material";

const API = "http://localhost:5000/api";

const statusColor = (s) => s === "Active" ? "success" : s === "Inactive" ? "default" : "warning";
const typeColor = (t) => t === "Business" ? "primary" : "secondary";
const fmt = (n) => "₹" + Number(String(n || 0).replace(/[^0-9]/g, "")).toLocaleString("en-IN");

const STATES = [
  "Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Maharashtra",
  "Gujarat","Rajasthan","Uttar Pradesh","Delhi","West Bengal","Kerala",
  "Punjab","Haryana","Madhya Pradesh","Bihar","Odisha","Others",
];

const VJC_SERVICES = [
  "Canada PR Visa","Canada Tourist Visa","Canada Visit Visa",
  "Canada Study Visa","Canada Spouse Visa","Canada Super Visa",
  "Germany Visit Visa","Germany Tourist Visa","Germany Study Visa",
  "Germany Family Reunion Visa","Germany Opportunity Card",
  "Australia PR Visa","Australia Visit/Tourist Visa","Australia Study Visa",
  "Australia Spouse Visa","New Zealand Visit Visa","New Zealand Study Visa",
  "US Study Visa","US H1B Visa","US B1/B2 Visa",
  "UK Study Visa","UK Youth Mobility Program","UK Visit/Tourist Visa",
  "Austria Job Seeker Visa","Portugal Job Seeker Visa",
  "Job Search Service","South Africa Critical Skilled Visa","Other",
];

const EMPTY_FORM = {
  type: "Business", status: "Active", name: "",
  service_type: "", phone: "", email: "",
  gstin: "", address: "", city: "", state: "", notes: "",
};

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ── Profile Dialog ─────────────────────────────────────────────────────────
function CustomerProfile({ customer, open, onClose, onCreateInvoice, onRecordPayment }) {
  const [tab, setTab] = useState(0);
  if (!customer) return null;
  const initials = customer.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "#1976d2", width: 48, height: 48, fontSize: 18, fontWeight: 700 }}>
            {initials}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{customer.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {customer.customer_id} · {customer.service_type || "—"}
            </Typography>
          </Box>
          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            <Chip label={customer.status} color={statusColor(customer.status)} size="small" />
            <Chip label={customer.type} color={typeColor(customer.type)} size="small" variant="outlined" />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button size="small" variant="contained"
            onClick={() => { onCreateInvoice(customer); onClose(); }}>
            + Create Invoice
          </Button>
          <Button size="small" variant="outlined" color="success"
            onClick={() => { onRecordPayment(customer); onClose(); }}>
            Record Payment
          </Button>
        </Box>
        <Box sx={{ display: "flex", gap: 3, mt: 2, flexWrap: "wrap" }}>
          {[
            { label: "Outstanding", value: fmt(customer.outstanding), color: customer.outstanding > 0 ? "error.main" : "success.main" },
            { label: "Total Payments", value: fmt(customer.total_payments) },
            { label: "Last Transaction", value: customer.last_transaction ? new Date(customer.last_transaction).toLocaleDateString('en-IN') : "—" },
          ].map((stat) => (
            <Box key={stat.label} sx={{ minWidth: 120 }}>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              <Typography variant="body2" fontWeight={700} color={stat.color}>{stat.value}</Typography>
            </Box>
          ))}
        </Box>
      </DialogTitle>
      <Divider sx={{ mt: 2 }} />
      <DialogContent sx={{ pt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
          <Tab label="Details" />
        </Tabs>
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            {[
              ["Phone", customer.phone],
              ["Email", customer.email],
              ["Service Type", customer.service_type || "—"],
              ["GST Number", customer.gstin || "—"],
              ["City", customer.city],
              ["State", customer.state],
              ["Address", customer.address],
              ["Notes", customer.notes || "—"],
            ].map(([label, val]) => (
              <Grid item xs={12} sm={6} key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={500}>{val}</Typography>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Customer Form Dialog ───────────────────────────────────────────────────
function CustomerFormDialog({ open, onClose, onSave, initial, title }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  useEffect(() => { setForm(initial || EMPTY_FORM); }, [initial, open]);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField select fullWidth margin="normal" label="Customer Type" value={form.type} onChange={set("type")}>
          <MenuItem value="Business">Business</MenuItem>
          <MenuItem value="Individual">Individual</MenuItem>
        </TextField>
        <TextField select fullWidth margin="normal" label="Status" value={form.status} onChange={set("status")}>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </TextField>
        <TextField fullWidth margin="normal" label="Customer Name *" value={form.name} onChange={set("name")} />
        <TextField select fullWidth margin="normal" label="Service Type" value={form.service_type || ""} onChange={set("service_type")}>
          {VJC_SERVICES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField fullWidth margin="normal" label="Phone" value={form.phone} onChange={set("phone")} />
        <TextField fullWidth margin="normal" label="Email" value={form.email} onChange={set("email")} />
        <TextField fullWidth margin="normal" label="GST Number" value={form.gstin} onChange={set("gstin")} />
        <TextField fullWidth margin="normal" label="Address" multiline rows={2} value={form.address} onChange={set("address")} />
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <TextField fullWidth margin="normal" label="City" value={form.city} onChange={set("city")} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth margin="normal" label="State" value={form.state} onChange={set("state")}>
              {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
        <TextField fullWidth margin="normal" label="Notes" multiline rows={2} value={form.notes} onChange={set("notes")} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => { if (form.name) { onSave(form); onClose(); } }}>
          {title.startsWith("Edit") ? "Update Customer" : "Save Customer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Invoice Dialog ─────────────────────────────────────────────────────────
function InvoiceDialog({ open, onClose, customer }) {
  const [form, setForm] = useState({ amount: "", dueDate: "", description: "" });
  const [loading, setLoading] = useState(false);
  if (!customer) return null;

  const handleSubmit = async () => {
    if (!form.amount) return alert("Please enter invoice amount!");
    setLoading(true);
    try {
      const res = await fetch(`${API}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          items: [{ description: form.description, amount: Number(form.amount) }],
          subtotal: Number(form.amount),
          tax_percent: 18,
          tax_amount: Number(form.amount) * 0.18,
          total_amount: Number(form.amount) * 1.18,
          due_date: form.dueDate,
          notes: form.description,
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert("✅ Invoice created! Email sent to Chairman successfully!");
        setForm({ amount: "", dueDate: "", description: "" });
        onClose();
      } else {
        alert("❌ Error: " + result.message);
      }
    } catch (err) {
      alert("❌ Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Invoice</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customer: <strong>{customer.name}</strong>
        </Typography>
        <TextField
          fullWidth margin="normal" label="Invoice Amount (₹)" type="number"
          value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <TextField
          fullWidth margin="normal" label="Due Date" type="date"
          InputLabelProps={{ shrink: true }}
          value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        <TextField
          fullWidth margin="normal" label="Description"
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        {form.amount && (
          <Box sx={{ mt: 1, p: 1.5, bgcolor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Subtotal: {fmt(form.amount)} + Tax(18%): {fmt(Number(form.amount) * 0.18)}
            </Typography>
            <Typography variant="body2" fontWeight={700} color="primary">
              Total: {fmt(Number(form.amount) * 1.18)}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? "Sending..." : "Create & Send to Chairman"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Payment Dialog ─────────────────────────────────────────────────────────
function PaymentDialog({ open, onClose, customer, onSuccess }) {
  const [form, setForm] = useState({ amount: "", payment_mode: "Cash", payment_date: "", notes: "" });
  const [loading, setLoading] = useState(false);
  if (!customer) return null;

  const MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];

  const handleSubmit = async () => {
    if (!form.amount) return alert("Amount enter చేయి!");
    if (Number(form.amount) > Number(customer.outstanding)) {
      return alert(`❌ Amount outstanding కంటే ఎక్కువగా ఉంది! Outstanding: ${fmt(customer.outstanding)}`);
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          amount: Number(form.amount),
          payment_mode: form.payment_mode,
          payment_date: form.payment_date || new Date().toISOString().split("T")[0],
          notes: form.notes,
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert(`✅ Payment ${fmt(form.amount)} recorded successfully!`);
        setForm({ amount: "", payment_mode: "Cash", payment_date: "", notes: "" });
        onSuccess();
        onClose();
      } else {
        alert("❌ Error: " + result.message);
      }
    } catch (err) {
      alert("❌ Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  const remaining = Number(customer.outstanding) - Number(form.amount || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Customer: <strong>{customer.name}</strong>
        </Typography>
        <Box sx={{ p: 1.5, bgcolor: "#fff3e0", borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" color="error" fontWeight={700}>
            Outstanding: {fmt(customer.outstanding)}
          </Typography>
        </Box>
        <TextField
          fullWidth margin="normal" label="Payment Amount (₹)" type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        {form.amount && Number(form.amount) > 0 && (
          <Box sx={{ px: 1, mb: 1 }}>
            <Typography variant="caption" color={remaining < 0 ? "error" : "success.main"}>
              {remaining <= 0 ? "✅ Full payment — Outstanding: ₹0" : `Remaining outstanding: ${fmt(remaining)}`}
            </Typography>
          </Box>
        )}
        <TextField
          select fullWidth margin="normal" label="Payment Mode"
          value={form.payment_mode}
          onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
          {MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>
        <TextField
          fullWidth margin="normal" label="Payment Date" type="date"
          InputLabelProps={{ shrink: true }}
          value={form.payment_date}
          onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
        />
        <TextField
          fullWidth margin="normal" label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
function Customers() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterStatus !== "All") params.append("status", filterStatus);
      if (filterType !== "All") params.append("type", filterType);
      const res = await fetch(`${API}/customers?${params}`);
      const data = await res.json();
      if (data.success) { setCustomers(data.customers); setStats(data.stats); }
    } catch (err) {
      setError("Unable to connect to backend server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, [search, filterStatus, filterType]);

  const handleAdd = async (form) => {
    try {
      const res = await fetch(`${API}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) fetchCustomers();
      else alert(data.message);
    } catch { alert("Failed to add customer"); }
  };

  const handleEdit = async (form) => {
    try {
      const res = await fetch(`${API}/customers/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) fetchCustomers();
      else alert(data.message);
    } catch { alert("Failed to update customer"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      const res = await fetch(`${API}/customers/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Customer deleted!");
        fetchCustomers();
      } else {
        alert("❌ Delete failed: " + data.message);
      }
    } catch (err) {
      alert("❌ Delete error: " + err.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Customers</Typography>
        <Button variant="contained" size="large" onClick={() => setAddOpen(true)}>
          + ADD CUSTOMER
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Customers", value: stats.total_customers || 0, color: "#1976d2" },
          { label: "Active Customers", value: stats.active_customers || 0, color: "#2e7d32" },
          { label: "Outstanding", value: fmt(stats.total_outstanding || 0), color: "#d32f2f" },
          { label: "Total Payments", value: fmt(stats.total_payments || 0), color: "#7b1fa2" },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card sx={{ borderLeft: `4px solid ${stat.color}` }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                <Typography variant="h5" fontWeight={700} color={stat.color}>{stat.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField label="Search Customer" size="small" value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ width: 280 }} />
        <TextField select label="Status" size="small" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)} sx={{ width: 130 }}>
          {["All", "Active", "Inactive"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select label="Type" size="small" value={filterType}
          onChange={(e) => setFilterType(e.target.value)} sx={{ width: 130 }}>
          {["All", "Business", "Individual"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          Showing {customers.length} of {stats.total_customers || 0}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Customer ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Service Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Outstanding</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Transaction</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No customers found. Click "+ ADD CUSTOMER" to create a customer.
                  </TableCell>
                </TableRow>
              )}
              {customers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {customer.customer_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: "#1976d2" }}>
                        {customer.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{customer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{customer.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={customer.service_type || customer.company || "—"}
                      size="small" variant="outlined" color="info"
                    />
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>
                    <Chip label={customer.type} color={typeColor(customer.type)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={customer.status} color={statusColor(customer.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}
                      color={customer.outstanding > 0 ? "error" : "success.main"}>
                      {fmt(customer.outstanding)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {customer.last_transaction
                        ? new Date(customer.last_transaction).toLocaleDateString('en-IN')
                        : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small"
                        onClick={() => { setSelected(customer); setViewOpen(true); }}>
                        View
                      </Button>
                      <Button size="small"
                        onClick={() => { setSelected(customer); setEditOpen(true); }}>
                        Edit
                      </Button>
                      <Button size="small" color="success"
                        onClick={() => { setSelected(customer); setInvoiceOpen(true); }}>
                        Invoice
                      </Button>
                      <Button size="small" color="warning"
                        onClick={() => { setSelected(customer); setPaymentOpen(true); }}>
                        Payment
                      </Button>
                      <Button size="small" color="error"
                        onClick={() => handleDelete(customer.id)}>
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CustomerFormDialog open={addOpen} onClose={() => setAddOpen(false)}
        onSave={handleAdd} initial={EMPTY_FORM} title="Add Customer" />

      <CustomerFormDialog open={editOpen} onClose={() => setEditOpen(false)}
        onSave={handleEdit} title="Edit Customer"
        initial={selected ? {
          type: selected.type, status: selected.status, name: selected.name,
          service_type: selected.service_type || selected.company || "",
          phone: selected.phone || "", email: selected.email || "",
          gstin: selected.gstin || "", address: selected.address || "",
          city: selected.city || "", state: selected.state || "",
          notes: selected.notes || "",
        } : EMPTY_FORM} />

      <CustomerProfile
        customer={selected} open={viewOpen}
        onClose={() => setViewOpen(false)}
        onCreateInvoice={(c) => { setSelected(c); setInvoiceOpen(true); }}
        onRecordPayment={(c) => { setSelected(c); setPaymentOpen(true); }}
      />

      <InvoiceDialog open={invoiceOpen} onClose={() => setInvoiceOpen(false)}
        customer={selected} />

      <PaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        customer={selected}
        onSuccess={fetchCustomers}
      />
    </Box>
  );
}

export default Customers;