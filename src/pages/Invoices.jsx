import { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Divider, IconButton, CircularProgress, Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// ─── API Base ────────────────────────────────────────────────
const API = axios.create({
  baseURL: "https://vjc-invoice-backend.vercel.app/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("vjc_invoice_auth");

  console.log("TOKEN =", token);
  console.log("REQUEST =", config.url);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("HEADERS =", config.headers);

  return config;
});
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

const STATUS_COLOR = {
  Draft:            "default",
  Sent:             "primary",
  Unpaid:           "warning",
  Overdue:          "error",
  "Partially Paid": "info",
  Paid:             "success",
  Cancelled:        "default",
};

const NEXT_STATUS = {
  Draft:            ["Sent", "Cancelled"],
  Sent:             ["Unpaid", "Partially Paid", "Paid", "Cancelled"],
  Unpaid:           ["Overdue", "Partially Paid", "Paid", "Cancelled"],
  Overdue:          ["Partially Paid", "Paid", "Cancelled"],
  "Partially Paid": ["Paid", "Overdue", "Cancelled"],
  Paid:             [],
  Cancelled:        [],
};

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
  const [invoices, setInvoices]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [open, setOpen]         = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusChangeInv, setStatusChangeInv]   = useState(null);
  const [newStatus, setNewStatus]               = useState("");

  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);

  // ── Fetch all data on mount ──
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [invRes, cRes, iRes] = await Promise.all([
        API.get("/sales-invoices"),
        API.get("/customers"),
        API.get("/items"),
      ]);
setInvoices(invRes.data.data || []);
      setCustomers(cRes.data.customers || []);
      setItemsList(iRes.data.items || []);
    } catch (err) {
      setError("Failed to load data please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Auto Invoice Number ──
  const nextInvoiceNo = () => {
    const nums = invoices.map((inv) => {
      const match = (inv.invoice_id || inv.id || "").match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const max = nums.length ? Math.max(...nums) : 0;
    return `INV-${String(max + 1).padStart(6, "0")}`;
  };

  const openNew = () => {
    setForm({
      id: null,
      invoice_number: nextInvoiceNo(),
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

  // ── Line item helpers ──
  const updateLine = (key, field, value) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li) => {
        if (li._key !== key) return li;
        const updated = { ...li, [field]: value };
        if (field === "itemId") {
          const found = itemsList.find(
            (i) => String(i.id) === String(value)
          );
          if (found) {
            updated.description = found.service_name || "";
            updated.rate        = Number(found.price || 0);
            updated.gst         = Number(found.gst || 18);
          }
        }
        return updated;
      }),
    }));
  };

  const addLine    = () => setForm((f) => ({ ...f, lineItems: [...f.lineItems, emptyLineItem()] }));
  const removeLine = (key) => setForm((f) => ({ ...f, lineItems: f.lineItems.filter((l) => l._key !== key) }));

  // ── Calculations ──
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

  // ── Normalize invoice from API response ──
  const normalizeInvoice = (inv) => ({
    id:               inv.invoice_id || inv.id,
    invoice_number:   inv.invoice_id || inv.invoice_number || inv.id,
    customerId:       inv.customer_id || inv.customerId,
    customerName:     inv.customer_name || inv.customerName || "",
    invoiceDate:      (inv.invoice_date || inv.invoiceDate || "").slice(0, 10),
    dueDate:          (inv.due_date || inv.dueDate || "").slice(0, 10),
    terms:            inv.terms || "Due on Receipt",
    lineItems:        (inv.line_items || inv.lineItems || []).map((li, idx) => ({
      _key:        li._key || li.id || idx,
      itemId:      li.item_id || li.itemId || "",
      description: li.description || "",
      qty:         Number(li.qty || li.quantity || 1),
      rate:        Number(li.rate || li.unit_price || 0),
      gst:         Number(li.gst || li.tax_rate || 18),
      discount:    Number(li.discount || 0),
    })),
    notes:            inv.notes || "",
    status:           inv.status || "Draft",
    totalAmount:      Number(inv.total_amount || inv.totalAmount || 0),
  });

  // ── Save (Create / Update) ──
  const handleSave = async (status) => {
    if (!form.customerId || form.lineItems.every((l) => !l.itemId && !l.description)) return;
    setSaving(true);
    const { grandTotal } = totals(form.lineItems);

    const payload = {
      customer_id:   form.customerId,
      customer_name: form.customerName,
      invoice_date:  form.invoiceDate,
      due_date:      form.dueDate,
      terms:         form.terms,
      notes:         form.notes,
      status:        status,
      total_amount:  grandTotal,
      line_items:    form.lineItems.map((li) => ({
        item_id:     li.itemId,
        description: li.description,
        qty:         li.qty,
        rate:        li.rate,
        gst:         li.gst,
        discount:    li.discount,
      })),
    };

    try {
      if (form.id) {
        await API.put(`/sales-invoices/${form.id}`, payload);
      } else {
        await API.post("/sales-invoices", payload);
      }
      await fetchAll();
      setOpen(false);
    } catch (err) {
      setError("Failed to save invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Status change ──
  const handleStatusChange = async () => {
    if (!newStatus) return;
    try {
      await API.put(`/sales-invoices/${statusChangeInv.id}`, { status: newStatus });
      await fetchAll();
    } catch {
      setError("Failed to update invoice status.");
    }
    setStatusDialogOpen(false);
    setStatusChangeInv(null);
    setNewStatus("");
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await API.delete(`/sales-invoices/${id}`);
      setInvoices((prev) => prev.filter((i) => (i.invoice_id || i.id) !== id));
    } catch {
      setError("Failed to delete invoice.");
    }
  };

  // ── Normalize list for display ──
  const normalizedInvoices = invoices.map(normalizeInvoice);

  // ── Filter ──
  const filtered = normalizedInvoices.filter((inv) => {
    const matchSearch =
      (inv.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoice_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ──
  const totalRevenue = normalizedInvoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.totalAmount, 0);
  const outstanding = normalizedInvoices
    .filter((i) => ["Sent", "Unpaid", "Overdue", "Partially Paid"].includes(i.status))
    .reduce((s, i) => s + i.totalAmount, 0);
  const overdueCount = normalizedInvoices.filter((i) => i.status === "Overdue").length;
  const partialCount = normalizedInvoices.filter((i) => i.status === "Partially Paid").length;
  const paidCount    = normalizedInvoices.filter((i) => i.status === "Paid").length;

  // ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Invoices</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>
      )}

      {/* ✅ Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Invoices", value: normalizedInvoices.length, color: "#1976d2" },
          { label: "Paid",           value: paidCount,                 color: "#2e7d32" },
          { label: "Overdue",        value: overdueCount,              color: "#d32f2f" },
          { label: "Partially Paid", value: partialCount,              color: "#0288d1" },
          { label: "Outstanding",    value: formatPrice(outstanding),  color: "#ed6c02" },
         
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No invoices found
                </TableCell>
              </TableRow>
            ) : filtered.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell sx={{ color: "#1976d2", fontWeight: "bold" }}>{inv.invoice_number}</TableCell>
                <TableCell>{inv.customerName}</TableCell>
                <TableCell>{inv.invoiceDate}</TableCell>
                <TableCell
                  sx={{ color: inv.status === "Overdue" ? "#d32f2f" : "inherit", fontWeight: inv.status === "Overdue" ? "bold" : "normal" }}
                >
                  {inv.dueDate}
                </TableCell>
                <TableCell><strong>{formatPrice(inv.totalAmount)}</strong></TableCell>
                <TableCell>
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
                  <Button size="small" color="error" onClick={() => handleDelete(inv.id)}>
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
          {form?.invoice_number} — {form?.id ? "Edit Invoice" : "New Invoice"}
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
                    const c = customers.find(
                      (x) => String(x.customer_id) === String(e.target.value)
                    );
                    setForm({
                      ...form,
                      customerId: e.target.value,
                      customerName: c?.name || c?.customer_name || c?.display_name || "",
                    });
                  }}
                >
                  {customers.map((c) => {
                    const cId   = c.customer_id;
                    const cName = c.name || c.customer_name || c.display_name || "";
                    const cComp = c.company || c.company_name || "";

                    return (
                      <MenuItem key={cId} value={cId}>
                        {cName}{cComp ? ` — ${cComp}` : ""}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>

              {/* Invoice # */}
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Invoice #" value={form.invoice_number} disabled />
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
                            {itemsList.map((it) => (
                              <MenuItem key={it.id} value={it.id}>{it.service_name}</MenuItem>
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
          <Button onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="outlined" onClick={() => handleSave("Draft")} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : "Save as Draft"}
          </Button>
          <Button variant="contained" onClick={() => handleSave("Sent")} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : "Save and Send"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── VIEW DIALOG ── */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: "#1976d2", color: "white" }}>
          Invoice Details — {selected?.invoice_number}
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