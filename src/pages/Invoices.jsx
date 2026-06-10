import { useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Divider, IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// ─── Helpers ────────────────────────────────────────────────
const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  });

const today = () => new Date().toISOString().split("T")[0];

const dueDateCalc = (term) => {
  const d = new Date();
  if (term === "Net 15") d.setDate(d.getDate() + 15);
  else if (term === "Net 30") d.setDate(d.getDate() + 30);
  else if (term === "Net 45") d.setDate(d.getDate() + 45);
  return d.toISOString().split("T")[0];
};

// ✅ All 6 statuses — Zoho life cycle complete
const STATUS_COLOR = {
  Draft:           "default",
  Sent:            "primary",
  Unpaid:          "warning",
  Overdue:         "error",
  "Partially Paid": "info",
  Paid:            "success",
  Cancelled:       "default",
};

// ✅ Life cycle flow: which statuses are allowed next from current
const NEXT_STATUS = {
  Draft:           ["Sent", "Cancelled"],
  Sent:            ["Unpaid", "Partially Paid", "Paid", "Cancelled"],
  Unpaid:          ["Overdue", "Partially Paid", "Paid", "Cancelled"],
  Overdue:         ["Partially Paid", "Paid", "Cancelled"],
  "Partially Paid": ["Paid", "Overdue", "Cancelled"],
  Paid:            [],
  Cancelled:       [],
};

// ─── Static seed data (replace with DB later) ───────────────
const CUSTOMERS = [
  { id: "CUS001", name: "Rahul Kumar", company: "ABC Pvt Ltd", email: "rahul@gmail.com" },
  { id: "CUS002", name: "Priya Reddy", company: "XYZ Solutions", email: "priya@gmail.com" },
  { id: "CUS003", name: "Vikram Singh", company: "Tech Corp", email: "vikram@gmail.com" },
];

const ITEMS_LIST = [
  { id: 1, serviceName: "Canada Study Visa", price: "150000", gst: "18" },
  { id: 2, serviceName: "Australia PR",       price: "250000", gst: "18" },
  { id: 3, serviceName: "UK Tourist Visa",    price: "65000",  gst: "18" },
];

const TERMS_OPTIONS = ["Due on Receipt", "Net 15", "Net 30", "Net 45"];

const emptyLineItem = () => ({
  _key: Date.now() + Math.random(),
  itemId: "",
  description: "",
  qty: 1,
  rate: 0,
  gst: 18,
  discount: 0,
});

// ─── Component ──────────────────────────────────────────────
function Invoices() {
  const [invoices, setInvoices] = useState([
    {
      id: "INV-000001",
      customerId: "CUS001",
      customerName: "Rahul Kumar",
      invoiceDate: "2026-05-28",
      dueDate: "2026-05-28",
      terms: "Due on Receipt",
      lineItems: [
        { _key: 1, itemId: 1, description: "Canada Study Visa", qty: 1, rate: 150000, gst: 18, discount: 0 },
      ],
      notes: "Thanks for your business.",
      status: "Paid",
      totalAmount: 177000,
    },
    {
      id: "INV-000002",
      customerId: "CUS002",
      customerName: "Priya Reddy",
      invoiceDate: "2026-06-01",
      dueDate: "2026-06-01",
      terms: "Due on Receipt",
      lineItems: [
        { _key: 2, itemId: 2, description: "Australia PR", qty: 1, rate: 250000, gst: 18, discount: 0 },
      ],
      notes: "",
      status: "Sent",
      totalAmount: 295000,
    },
    {
      id: "INV-000003",
      customerId: "CUS003",
      customerName: "Vikram Singh",
      invoiceDate: "2026-05-20",
      dueDate: "2026-05-20",
      terms: "Due on Receipt",
      lineItems: [
        { _key: 3, itemId: 3, description: "UK Tourist Visa", qty: 1, rate: 65000, gst: 18, discount: 0 },
      ],
      notes: "",
      status: "Overdue",
      totalAmount: 76700,
    },
  ]);

  // ── form state ──
  const [open, setOpen]         = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ✅ Status change dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusChangeInv, setStatusChangeInv]   = useState(null);
  const [newStatus, setNewStatus]               = useState("");

  const nextInvoiceNo = () => {
    const nums = invoices.map((inv) => parseInt(inv.id.replace("INV-", ""), 10));
    const max  = nums.length ? Math.max(...nums) : 0;
    return `INV-${String(max + 1).padStart(6, "0")}`;
  };

  const [form, setForm] = useState(null);

  const openNew = () => {
    setForm({
      id: nextInvoiceNo(),
      customerId: "",
      customerName: "",
      invoiceDate: today(),
      dueDate: today(),
      terms: "Due on Receipt",
      lineItems: [emptyLineItem()],
      notes: "Thanks for your business.",
      status: "Draft",
    });
    setOpen(true);
  };

  // ── line item helpers ──
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
            updated.rate        = Number(found.price);
            updated.gst         = Number(found.gst);
          }
        }
        return updated;
      }),
    }));
  };

  const addLine    = () => setForm((f) => ({ ...f, lineItems: [...f.lineItems, emptyLineItem()] }));
  const removeLine = (key) => setForm((f) => ({ ...f, lineItems: f.lineItems.filter((l) => l._key !== key) }));

  // ── calculations ──
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
      subTotal  += a.taxable;
      totalGST  += a.gstAmt;
      grandTotal += a.total;
    });
    return { subTotal, totalGST, grandTotal };
  };

  // ── save ──
  const handleSave = (status) => {
    if (!form.customerId || form.lineItems.every((l) => !l.itemId && !l.description)) return;
    const { grandTotal } = totals(form.lineItems);
    const invoice = { ...form, status, totalAmount: grandTotal };

    setInvoices((prev) => {
      const exists = prev.find((i) => i.id === invoice.id);
      return exists
        ? prev.map((i) => (i.id === invoice.id ? invoice : i))
        : [...prev, invoice];
    });
    setOpen(false);
  };

  // ✅ Status change handler
  const handleStatusChange = () => {
    if (!newStatus) return;
    setInvoices((prev) =>
      prev.map((i) => (i.id === statusChangeInv.id ? { ...i, status: newStatus } : i))
    );
    setStatusDialogOpen(false);
    setStatusChangeInv(null);
    setNewStatus("");
  };

  // ── filter ──
  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
                        inv.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ✅ Stats — all statuses counted
  const totalRevenue    = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.totalAmount, 0);
  const outstanding     = invoices.filter((i) => ["Sent", "Unpaid", "Overdue", "Partially Paid"].includes(i.status)).reduce((s, i) => s + i.totalAmount, 0);
  const overdueCount    = invoices.filter((i) => i.status === "Overdue").length;
  const partialCount    = invoices.filter((i) => i.status === "Partially Paid").length;

  // ────────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Invoices</Typography>

      {/* ✅ Stats — updated with overdue + partial */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Invoices",   value: invoices.length,          color: "#1976d2" },
          { label: "Paid",             value: invoices.filter((i) => i.status === "Paid").length, color: "#2e7d32" },
          { label: "Overdue",          value: overdueCount,             color: "#d32f2f" },
          { label: "Partially Paid",   value: partialCount,             color: "#0288d1" },
          { label: "Outstanding",      value: formatPrice(outstanding), color: "#ed6c02" },
          { label: "Total Revenue",    value: formatPrice(totalRevenue), color: "#9c27b0" },
        ].map((s) => (
          <Grid item xs={12} md={2} key={s.label}>
            <Card sx={{ borderLeft: `4px solid ${s.color}` }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography color="text.secondary" variant="body2">{s.label}</Typography>
                <Typography variant="h6" fontWeight="bold">{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search + Filter + New */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="Search Invoice / Customer"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
        />
        <TextField
          select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 160 }}
        >
          {["All", "Draft", "Sent", "Unpaid", "Overdue", "Partially Paid", "Paid", "Cancelled"].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
          New Invoice
        </Button>
      </Box>

      {/* Invoice List Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {["Invoice #", "Customer", "Date", "Due Date", "Amount", "Status", "Actions"].map((h) => (
                <TableCell key={h}><strong>{h}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell sx={{ color: "#1976d2", fontWeight: "bold" }}>{inv.id}</TableCell>
                <TableCell>{inv.customerName}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell
                  sx={{ color: inv.status === "Overdue" ? "#d32f2f" : "inherit", fontWeight: inv.status === "Overdue" ? "bold" : "normal" }}
                >
                  {inv.dueDate}
                </TableCell>
                <TableCell><strong>{formatPrice(inv.totalAmount)}</strong></TableCell>
                <TableCell>
                  {/* ✅ Clickable chip → status change dialog */}
                  <Chip
                    label={inv.status}
                    color={STATUS_COLOR[inv.status] || "default"}
                    size="small"
                    onClick={() => {
                      if (NEXT_STATUS[inv.status]?.length > 0) {
                        setStatusChangeInv(inv);
                        setNewStatus("");
                        setStatusDialogOpen(true);
                      }
                    }}
                    sx={{ cursor: NEXT_STATUS[inv.status]?.length > 0 ? "pointer" : "default" }}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => { setSelected(inv); setViewOpen(true); }}>View</Button>
                  <Button size="small" onClick={() => { setForm({ ...inv }); setOpen(true); }}>Edit</Button>
                  <Button size="small" color="error"
                    onClick={() => setInvoices(invoices.filter((i) => i.id !== inv.id))}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ STATUS CHANGE DIALOG */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Invoice Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current: <strong>{statusChangeInv?.status}</strong>
          </Typography>
          <TextField
            select fullWidth label="Move to Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {(NEXT_STATUS[statusChangeInv?.status] || []).map((s) => (
              <MenuItem key={s} value={s}>
                <Chip label={s} color={STATUS_COLOR[s] || "default"} size="small" sx={{ mr: 1 }} />
                {s}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusChange} disabled={!newStatus}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── CREATE / EDIT DIALOG ── */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          {form?.id} — New Invoice
        </DialogTitle>

        {form && (
          <DialogContent sx={{ mt: 1 }}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>

              {/* Customer */}
              <Grid item xs={12} md={6}>
                <TextField
                  select fullWidth label="Customer Name *"
                  value={form.customerId}
                  onChange={(e) => {
                    const c = CUSTOMERS.find((x) => x.id === e.target.value);
                    setForm({ ...form, customerId: e.target.value, customerName: c?.name || "" });
                  }}
                >
                  {CUSTOMERS.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name} — {c.company}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Invoice # */}
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Invoice #" value={form.id} disabled />
              </Grid>

              {/* Dates */}
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Invoice Date *" type="date"
                  value={form.invoiceDate}
                  onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select fullWidth label="Terms"
                  value={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.value, dueDate: dueDateCalc(e.target.value) })}
                >
                  {TERMS_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Due Date" type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* ── Item Table ── */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Item Table</Typography>
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

            {/* ── Totals ── */}
            {(() => {
              const { subTotal, totalGST, grandTotal } = totals(form.lineItems);
              return (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Box sx={{ width: 320, bgcolor: "#f9f9f9", p: 2, borderRadius: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography>Sub Total</Typography>
                      <Typography>{formatPrice(subTotal)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography>GST</Typography>
                      <Typography>{formatPrice(totalGST)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography fontWeight="bold" variant="h6">Total (₹)</Typography>
                      <Typography fontWeight="bold" variant="h6" color="primary">
                        {formatPrice(grandTotal)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })()}

            {/* Notes */}
            <TextField
              fullWidth multiline rows={3} label="Customer Notes"
              value={form.notes} sx={{ mt: 3 }}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              helperText="Will be displayed on the invoice"
            />
          </DialogContent>
        )}

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="outlined" onClick={() => handleSave("Draft")}>Save as Draft</Button>
          <Button variant="contained" onClick={() => handleSave("Sent")}>Save and Send</Button>
        </DialogActions>
      </Dialog>

      {/* ── VIEW DIALOG ── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          Invoice Details — {selected?.id}
        </DialogTitle>

        {selected && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography color="text.secondary">Customer</Typography>
                <Typography fontWeight="bold">{selected.customerName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="text.secondary">Status</Typography>
                <Chip label={selected.status} color={STATUS_COLOR[selected.status] || "default"} />
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary">Invoice Date</Typography>
                <Typography>{selected.invoiceDate}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary">Due Date</Typography>
                <Typography>{selected.dueDate}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography color="text.secondary">Terms</Typography>
                <Typography>{selected.terms}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                  <TableRow>
                    {["Item", "Qty", "Rate", "Discount", "GST", "Amount"].map((h) => (
                      <TableCell key={h}><strong>{h}</strong></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selected.lineItems.map((li) => {
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

            {(() => {
              const { subTotal, totalGST, grandTotal } = totals(selected.lineItems);
              return (
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
                      <Typography fontWeight="bold">Total</Typography>
                      <Typography fontWeight="bold" color="primary">{formatPrice(grandTotal)}</Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })()}

            {selected.notes && (
              <Box sx={{ mt: 2 }}>
                <Typography color="text.secondary">Customer Notes</Typography>
                <Typography>{selected.notes}</Typography>
              </Box>
            )}
          </DialogContent>
        )}

        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Invoices;