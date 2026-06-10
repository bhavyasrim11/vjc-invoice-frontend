import { useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Avatar, IconButton, Tabs, Tab, Divider,
  Badge, Tooltip, LinearProgress, Stack
} from "@mui/material";

// ── icons via emoji strings (no extra dep) ──────────────────────────────────
const Icon = ({ children, style }) => (
  <span style={{ fontSize: 16, ...style }}>{children}</span>
);

// ── helpers ──────────────────────────────────────────────────────────────────
const nextId = (customers) => {
  const nums = customers.map((c) => parseInt(c.customerId?.replace("CUS", "") || 0));
  return `CUS${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
};

const statusColor = (s) =>
  s === "Active" ? "success" : s === "Inactive" ? "default" : "warning";

const typeColor = (t) => (t === "Business" ? "primary" : "secondary");

const fmt = (n) =>
  "₹" + Number(String(n).replace(/[^0-9]/g, "")).toLocaleString("en-IN");

const today = () => new Date().toISOString().split("T")[0];

const STATES = [
  "Andhra Pradesh","Telangana","Karnataka","Tamil Nadu","Maharashtra",
  "Gujarat","Rajasthan","Uttar Pradesh","Delhi","West Bengal","Kerala",
  "Punjab","Haryana","Madhya Pradesh","Bihar","Odisha","Others",
];

const PAYMENT_TERMS = ["Due on Receipt", "15 Days", "30 Days", "45 Days", "60 Days"];

const EMPTY_FORM = {
  customerType: "Business",
    status: "Active",
  name: "",
  company: "",
  phone: "",
  email: "",
  gstNumber: "",
  address: "",
  city: "",
  state: "",
  paymentTerms: "Due on Receipt",
  remarks: "",
};

const SEED = [
  {
    id: 1, customerId: "CUS001", name: "Rahul Kumar", company: "ABC Pvt Ltd",
    phone: "9876543210", email: "rahul@gmail.com", outstanding: 12000,
    customerType: "Business", status: "Active", gstNumber: "29ABCDE1234F1Z5",
    address: "12 MG Road", city: "Bengaluru", state: "Karnataka",
    paymentTerms: "30 Days", remarks: "Key account",
    totalInvoices: 8, totalPayments: 68000, lastTransaction: "2026-05-28",
    notes: [], documents: [], timeline: [
      { date: "2026-05-28", action: "Invoice #INV008 created", amount: "₹12,000" },
      { date: "2026-04-15", action: "Payment received", amount: "₹18,000" },
      { date: "2026-03-10", action: "Invoice #INV005 created", amount: "₹18,000" },
    ],
  },
  {
    id: 2, customerId: "CUS002", name: "Priya Reddy", company: "XYZ Solutions",
    phone: "9876543211", email: "priya@gmail.com", outstanding: 0,
    customerType: "Business", gstNumber: "36PQRST5678G2Z1",
    address: "45 Jubilee Hills", city: "Hyderabad", state: "Telangana",
    paymentTerms: "15 Days", remarks: "",
    totalInvoices: 12, totalPayments: 95000, lastTransaction: "2026-06-01",
    notes: [], documents: [], timeline: [
      { date: "2026-06-01", action: "Payment received", amount: "₹25,000" },
      { date: "2026-05-18", action: "Invoice #INV011 created", amount: "₹25,000" },
    ],
  },
  {
    id: 3, customerId: "CUS003", name: "Vikram Singh", company: "Tech Corp",
    phone: "9876543212", email: "vikram@gmail.com", outstanding: 5500,
    customerType: "Individual", status: "Active", gstNumber: "",
    address: "78 Anna Nagar", city: "Chennai", state: "Tamil Nadu",
    paymentTerms: "Due on Receipt", remarks: "Prefers WhatsApp communication",
    totalInvoices: 5, totalPayments: 42000, lastTransaction: "2026-05-20",
    notes: [{ id: 1, text: "Prefers evening calls", date: "2026-05-01" }],
    documents: [], timeline: [
      { date: "2026-05-20", action: "Invoice #INV009 created", amount: "₹5,500" },
      { date: "2026-04-30", action: "Payment received", amount: "₹8,000" },
    ],
  },
];

// ── Tab Panel ─────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ── Profile Dialog ────────────────────────────────────────────────────────────
function CustomerProfile({ customer, open, onClose, onCreateInvoice, onCreateQuote, onRecordPayment }) {
  const [tab, setTab] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState(customer?.notes || []);

  if (!customer) return null;

  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes([...notes, { id: Date.now(), text: noteText, date: today() }]);
    setNoteText("");
  };

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
            <Typography variant="body2" color="text.secondary">{customer.customerId} · {customer.company}</Typography>
          </Box>
          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            <Chip label={customer.status} color={statusColor(customer.status)} size="small" />
            <Chip label={customer.customerType} color={typeColor(customer.customerType)} size="small" variant="outlined" />
          </Box>
        </Box>

        {/* Quick Action Buttons */}
        <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
          <Button size="small" variant="contained" onClick={() => { onCreateInvoice(customer); onClose(); }}>
            + Create Invoice
          </Button>
          <Button size="small" variant="outlined" onClick={() => { onCreateQuote(customer); onClose(); }}>
            + Create Quote
          </Button>
          <Button size="small" variant="outlined" color="success" onClick={() => { onRecordPayment(customer); onClose(); }}>
            Record Payment
          </Button>
          <Button size="small" variant="outlined" color="secondary">
            Customer Statement
          </Button>
        </Box>

        {/* Stats Row */}
        <Box sx={{ display: "flex", gap: 3, mt: 2, flexWrap: "wrap" }}>
          {[
            { label: "Total Invoices", value: customer.totalInvoices },
            { label: "Total Payments", value: fmt(customer.totalPayments) },
            { label: "Outstanding", value: fmt(customer.outstanding), color: customer.outstanding > 0 ? "error.main" : "success.main" },
            { label: "Last Transaction", value: customer.lastTransaction || "—" },
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
          <Tab label="Timeline" />
          <Tab label="Notes" />
          <Tab label="Documents" />
        </Tabs>

        {/* Details Tab */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            {[
              ["Phone", customer.phone],
              ["Email", customer.email],
              ["GST Number", customer.gstNumber || "—"],
              ["Payment Terms", customer.paymentTerms],
              ["City", customer.city],
              ["State", customer.state],
              ["Address", customer.address],
              ["Remarks", customer.remarks || "—"],
            ].map(([label, val]) => (
              <Grid item xs={12} sm={6} key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={500}>{val}</Typography>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Timeline Tab */}
        <TabPanel value={tab} index={1}>
          {customer.timeline?.length === 0 && (
            <Typography color="text.secondary" variant="body2">No activity yet.</Typography>
          )}
          {customer.timeline?.map((item, i) => (
            <Box key={i} sx={{ display: "flex", gap: 2, mb: 2, alignItems: "flex-start" }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#1976d2", mt: 0.6, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" fontWeight={600}>{item.action}</Typography>
                <Typography variant="caption" color="text.secondary">{item.date} · {item.amount}</Typography>
              </Box>
            </Box>
          ))}
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              size="small" fullWidth placeholder="Add a note..."
              value={noteText} onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
            />
            <Button variant="contained" size="small" onClick={addNote}>Add</Button>
          </Box>
          {notes.length === 0 && <Typography variant="body2" color="text.secondary">No notes yet.</Typography>}
          {notes.map((n) => (
            <Paper key={n.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
              <Typography variant="body2">{n.text}</Typography>
              <Typography variant="caption" color="text.secondary">{n.date}</Typography>
            </Paper>
          ))}
        </TabPanel>

        {/* Documents Tab */}
        <TabPanel value={tab} index={3}>
          <Button variant="outlined" component="label" size="small">
            Upload Document
            <input type="file" hidden />
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No documents uploaded yet.
          </Typography>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Add / Edit Dialog ─────────────────────────────────────────────────────────
function CustomerFormDialog({ open, onClose, onSave, initial, title }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  // sync when initial changes (edit mode)
  useState(() => { setForm(initial || EMPTY_FORM); }, [initial]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField select fullWidth margin="normal" label="Customer Type" value={form.customerType} onChange={set("customerType")}>
          <MenuItem value="Business">Business</MenuItem>
          <MenuItem value="Individual">Individual</MenuItem>
        </TextField>
        <TextField select fullWidth margin="normal" label="Status" value={form.status || "Active"} onChange={set("status")}>
  <MenuItem value="Active">Active</MenuItem>
  <MenuItem value="Inactive">Inactive</MenuItem>
</TextField>
        <TextField fullWidth margin="normal" label="Customer Name *" value={form.name} onChange={set("name")} />
        <TextField fullWidth margin="normal" label="Company Name" value={form.company} onChange={set("company")} />
        <TextField fullWidth margin="normal" label="Phone" value={form.phone} onChange={set("phone")} />
        <TextField fullWidth margin="normal" label="Email" value={form.email} onChange={set("email")} />
        <TextField fullWidth margin="normal" label="GST Number" value={form.gstNumber} onChange={set("gstNumber")} />
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
        <TextField select fullWidth margin="normal" label="Payment Terms" value={form.paymentTerms} onChange={set("paymentTerms")}>
          {PAYMENT_TERMS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField fullWidth margin="normal" label="Remarks" multiline rows={2} value={form.remarks} onChange={set("remarks")} />
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

// ── Quick Action Dialogs ──────────────────────────────────────────────────────
function QuickActionDialog({ open, onClose, title, customer, fields, actionLabel, onSubmit }) {
  const [data, setData] = useState({});
  if (!customer) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customer: <strong>{customer.name}</strong> ({customer.customerId})
        </Typography>
        {fields.map((f) => (
          <TextField key={f.key} fullWidth margin="normal" label={f.label} type={f.type || "text"}
            onChange={(e) => setData({ ...data, [f.key]: e.target.value })} />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => { onSubmit(data); onClose(); }}>{actionLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function Customers() {
  const [customers, setCustomers] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  // dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // computed stats
  const totalOutstanding = customers.reduce((s, c) => s + (c.outstanding || 0), 0);
  const totalPaid = customers.reduce((s, c) => s + (c.totalPayments || 0), 0);
  const activeCount = customers.filter((c) => c.status === "Active").length;

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchQ =
      c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.customerId?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchType = filterType === "All" || c.customerType === filterType;
    return matchQ && matchStatus && matchType;
  });

  const handleAdd = (form) => {
    setCustomers([...customers, {
      id: Date.now(),
      customerId: nextId(customers),
      ...form,
      status: "Active",
      outstanding: 0,
      totalInvoices: 0,
      totalPayments: 0,
      lastTransaction: null,
      notes: [], documents: [], timeline: [],
    }]);
  };

  const handleEdit = (form) => {
    setCustomers(customers.map((c) => c.id === selected.id ? { ...c, ...form } : c));
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this customer?")) {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  const handleToggleStatus = (id) => {
    setCustomers(customers.map((c) =>
      c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c
    ));
  };

  const openEdit = (customer) => {
    setSelected(customer);
    setEditOpen(true);
  };

  const openView = (customer) => {
    setSelected(customer);
    setViewOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Customers</Typography>
        <Button variant="contained" size="large" onClick={() => setAddOpen(true)}>
          + Add Customer
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Customers", value: customers.length, color: "#1976d2" },
          { label: "Active Customers", value: activeCount, color: "#2e7d32" },
          { label: "Outstanding", value: fmt(totalOutstanding), color: "#d32f2f" },
          { label: "Total Payments", value: fmt(totalPaid), color: "#7b1fa2" },
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

      {/* Filters Row */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label="Search Customer"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
          placeholder="Name, ID, phone, email..."
        />
        <TextField select label="Status" size="small" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} sx={{ width: 130 }}>
          {["All", "Active", "Inactive"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select label="Type" size="small" value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ width: 130 }}>
          {["All", "Business", "Individual"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          Showing {filtered.length} of {customers.length}
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Customer ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Invoices</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Outstanding</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Last Transaction</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No customers found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {customer.customerId}
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
                <TableCell>{customer.company || "—"}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  <Chip label={customer.customerType} color={typeColor(customer.customerType)} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.status}
                    color={statusColor(customer.status)}
                    size="small"
                    onClick={() => handleToggleStatus(customer.id)}
                    sx={{ cursor: "pointer" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Badge badgeContent={customer.totalInvoices} color="primary" max={99}>
                    <Box sx={{ width: 24 }} />
                  </Badge>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={customer.outstanding > 0 ? "error" : "success.main"}
                  >
                    {fmt(customer.outstanding)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {customer.lastTransaction || "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" onClick={() => openView(customer)}>View</Button>
                    <Button size="small" onClick={() => openEdit(customer)}>Edit</Button>
                    <Button size="small" color="success" onClick={() => { setSelected(customer); setInvoiceOpen(true); }}>Invoice</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(customer.id)}>Delete</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Dialog */}
      <CustomerFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
        initial={EMPTY_FORM}
        title="Add Customer"
      />

      {/* Edit Dialog */}
      <CustomerFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEdit}
        initial={selected}
        title="Edit Customer"
      />

      {/* Profile / View Dialog */}
      <CustomerProfile
        customer={selected}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        onCreateInvoice={(c) => { setSelected(c); setInvoiceOpen(true); }}
        onCreateQuote={(c) => { setSelected(c); setQuoteOpen(true); }}
        onRecordPayment={(c) => { setSelected(c); setPaymentOpen(true); }}
      />

      {/* Create Invoice */}
      <QuickActionDialog
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Create Invoice"
        customer={selected}
        actionLabel="Create Invoice"
        fields={[
          { key: "amount", label: "Invoice Amount (₹)", type: "number" },
          { key: "dueDate", label: "Due Date", type: "date" },
          { key: "description", label: "Description" },
        ]}
        onSubmit={(data) => {
          const amount = Number(data.amount || 0);
          setCustomers(customers.map((c) =>
            c.id === selected?.id
              ? {
                  ...c,
                  outstanding: (c.outstanding || 0) + amount,
                  totalInvoices: (c.totalInvoices || 0) + 1,
                  lastTransaction: today(),
                  timeline: [
                    { date: today(), action: `Invoice created`, amount: fmt(amount) },
                    ...(c.timeline || []),
                  ],
                }
              : c
          ));
        }}
      />

      {/* Create Quote */}
      <QuickActionDialog
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        title="Create Quote"
        customer={selected}
        actionLabel="Create Quote"
        fields={[
          { key: "amount", label: "Quote Amount (₹)", type: "number" },
          { key: "validUntil", label: "Valid Until", type: "date" },
          { key: "description", label: "Description" },
        ]}
        onSubmit={(data) => {
          setCustomers(customers.map((c) =>
            c.id === selected?.id
              ? {
                  ...c,
                  lastTransaction: today(),
                  timeline: [
                    { date: today(), action: `Quote created`, amount: fmt(Number(data.amount || 0)) },
                    ...(c.timeline || []),
                  ],
                }
              : c
          ));
        }}
      />

      {/* Record Payment */}
      <QuickActionDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record Payment"
        customer={selected}
        actionLabel="Record Payment"
        fields={[
          { key: "amount", label: "Payment Amount (₹)", type: "number" },
          { key: "date", label: "Payment Date", type: "date" },
          { key: "mode", label: "Payment Mode (Cash/UPI/Bank)" },
        ]}
        onSubmit={(data) => {
          const amount = Number(data.amount || 0);
          setCustomers(customers.map((c) =>
            c.id === selected?.id
              ? {
                  ...c,
                  outstanding: Math.max(0, (c.outstanding || 0) - amount),
                  totalPayments: (c.totalPayments || 0) + amount,
                  lastTransaction: data.date || today(),
                  timeline: [
                    { date: data.date || today(), action: `Payment received (${data.mode || "—"})`, amount: fmt(amount) },
                    ...(c.timeline || []),
                  ],
                }
              : c
          ));
        }}
      />
    </Box>
  );
}

export default Customers;