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

const expiryDateCalc = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

// ✅ Zoho Quote Life Cycle
// QUOTE → SENT TO CUSTOMER → ACCEPT → INVOICE
//                          ↘ REJECT
const STATUS_COLOR = {
  Draft:    "default",
  Sent:     "primary",
  Accepted: "success",
  Rejected: "error",
  Invoiced: "secondary",
  Expired:  "warning",
};

const NEXT_STATUS = {
  Draft:    ["Sent", "Expired"],
  Sent:     ["Accepted", "Rejected", "Expired"],
  Accepted: ["Invoiced"],
  Rejected: [],
  Invoiced: [],
  Expired:  [],
};

// ─── Seed Data ──────────────────────────────────────────────
const CUSTOMERS = [
  { id: "CUS001", name: "Rahul Kumar",  company: "ABC Pvt Ltd",    email: "rahul@gmail.com" },
  { id: "CUS002", name: "Priya Reddy",  company: "XYZ Solutions",  email: "priya@gmail.com" },
  { id: "CUS003", name: "Vikram Singh", company: "Tech Corp",      email: "vikram@gmail.com" },
];

const SALESPERSONS = ["Ravi Kumar", "Sneha Reddy", "Arjun Sharma", "Deepika Nair"];

const ITEMS_LIST = [
  { id: 1, serviceName: "Canada Study Visa", price: "150000", gst: "18" },
  { id: 2, serviceName: "Australia PR",       price: "250000", gst: "18" },
  { id: 3, serviceName: "UK Tourist Visa",    price: "65000",  gst: "18" },
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

// ─── Component ──────────────────────────────────────────────
function Quotes() {
  const [quotes, setQuotes] = useState([
    {
      id: "QT-000001",
      customerId: "CUS001",
      customerName: "Rahul Kumar",
      reference: "REF-001",
      quoteDate: "2026-05-28",
      expiryDate: "2026-06-28",
      salesperson: "Ravi Kumar",
      lineItems: [
        { _key: 1, itemId: 1, description: "Canada Study Visa", qty: 1, rate: 150000, gst: 18, discount: 0 },
      ],
      notes: "Looking forward for your business.",
      termsConditions: "Payment to be made within 30 days.",
      status: "Accepted",
      totalAmount: 177000,
    },
    {
      id: "QT-000002",
      customerId: "CUS002",
      customerName: "Priya Reddy",
      reference: "",
      quoteDate: "2026-06-01",
      expiryDate: "2026-07-01",
      salesperson: "Sneha Reddy",
      lineItems: [
        { _key: 2, itemId: 2, description: "Australia PR", qty: 1, rate: 250000, gst: 18, discount: 0 },
      ],
      notes: "Looking forward for your business.",
      termsConditions: "",
      status: "Sent",
      totalAmount: 295000,
    },
    {
      id: "QT-000003",
      customerId: "CUS003",
      customerName: "Vikram Singh",
      reference: "",
      quoteDate: "2026-05-15",
      expiryDate: "2026-06-15",
      salesperson: "Arjun Sharma",
      lineItems: [
        { _key: 3, itemId: 3, description: "UK Tourist Visa", qty: 1, rate: 65000, gst: 18, discount: 5 },
      ],
      notes: "",
      termsConditions: "",
      status: "Rejected",
      totalAmount: 73373,
    },
  ]);

  // ── UI state ──
  const [open, setOpen]         = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ── Status change dialog ──
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusChangeQt, setStatusChangeQt]     = useState(null);
  const [newStatus, setNewStatus]               = useState("");

  const [form, setForm] = useState(null);

  // ── Auto Quote Number ──
  const nextQuoteNo = () => {
    const nums = quotes.map((q) => parseInt(q.id.replace("QT-", ""), 10));
    const max  = nums.length ? Math.max(...nums) : 0;
    return `QT-${String(max + 1).padStart(6, "0")}`;
  };

  const openNew = () => {
    setForm({
      id: nextQuoteNo(),
      customerId: "",
      customerName: "",
      reference: "",
      quoteDate: today(),
      expiryDate: expiryDateCalc(),
      salesperson: "",
      lineItems: [emptyLineItem()],
      notes: "Looking forward for your business.",
      termsConditions: "",
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
      subTotal  += a.taxable;
      totalGST  += a.gstAmt;
      grandTotal += a.total;
    });
    return { subTotal, totalGST, grandTotal };
  };

  // ── Save ──
  const handleSave = (status) => {
    if (!form.customerId || form.lineItems.every((l) => !l.itemId && !l.description)) return;
    const { grandTotal } = totals(form.lineItems);
    const quote = { ...form, status, totalAmount: grandTotal };

    setQuotes((prev) => {
      const exists = prev.find((q) => q.id === quote.id);
      return exists
        ? prev.map((q) => (q.id === quote.id ? quote : q))
        : [...prev, quote];
    });
    setOpen(false);
  };

  // ── Status change ──
  const handleStatusChange = () => {
    if (!newStatus) return;
    setQuotes((prev) =>
      prev.map((q) => (q.id === statusChangeQt.id ? { ...q, status: newStatus } : q))
    );
    setStatusDialogOpen(false);
    setStatusChangeQt(null);
    setNewStatus("");
  };

  // ── Convert to Invoice (Accepted → Invoiced) ──
  const handleConvertToInvoice = (quote) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, status: "Invoiced" } : q))
    );
    alert(`✅ QT-${quote.id} → Invoice create chesaamu!\nInvoices page lo INV auto add avutundi (backend tho).`);
  };

  // ── Filter ──
  const filtered = quotes.filter((q) => {
    const matchSearch = q.customerName.toLowerCase().includes(search.toLowerCase()) ||
                        q.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Stats ──
  const acceptedCount = quotes.filter((q) => q.status === "Accepted").length;
  const rejectedCount = quotes.filter((q) => q.status === "Rejected").length;
  const invoicedCount = quotes.filter((q) => q.status === "Invoiced").length;
  const totalValue    = quotes.reduce((s, q) => s + q.totalAmount, 0);

  // ────────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Quotes</Typography>

      {/* ✅ Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Quotes",  value: quotes.length,     color: "#1976d2" },
          { label: "Accepted",      value: acceptedCount,     color: "#2e7d32" },
          { label: "Rejected",      value: rejectedCount,     color: "#d32f2f" },
          { label: "Invoiced",      value: invoicedCount,     color: "#7b1fa2" },
          { label: "Total Value",   value: formatPrice(totalValue), color: "#ed6c02" },
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

      {/* Search + Filter + New */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="Search Quote / Customer"
          size="small" value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 280 }}
        />
        <TextField
          select size="small" label="Status" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)} sx={{ width: 160 }}
        >
          {["All", "Draft", "Sent", "Accepted", "Rejected", "Invoiced", "Expired"].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
          New Quote
        </Button>
      </Box>

      {/* Quotes Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {["Quote #", "Customer", "Date", "Expiry", "Salesperson", "Amount", "Status", "Actions"].map((h) => (
                <TableCell key={h}><strong>{h}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((qt) => (
              <TableRow key={qt.id} hover>
                <TableCell sx={{ color: "#1976d2", fontWeight: "bold" }}>{qt.id}</TableCell>
                <TableCell>{qt.customerName}</TableCell>
                <TableCell>{qt.quoteDate}</TableCell>
                <TableCell
                  sx={{ color: qt.status === "Expired" ? "#d32f2f" : "inherit", fontWeight: qt.status === "Expired" ? "bold" : "normal" }}
                >
                  {qt.expiryDate}
                </TableCell>
                <TableCell>{qt.salesperson || "—"}</TableCell>
                <TableCell><strong>{formatPrice(qt.totalAmount)}</strong></TableCell>
                <TableCell>
                  {/* ✅ Clickable chip → status flow */}
                  <Chip
                    label={qt.status}
                    color={STATUS_COLOR[qt.status] || "default"}
                    size="small"
                    onClick={() => {
                      if (NEXT_STATUS[qt.status]?.length > 0) {
                        setStatusChangeQt(qt);
                        setNewStatus("");
                        setStatusDialogOpen(true);
                      }
                    }}
                    sx={{ cursor: NEXT_STATUS[qt.status]?.length > 0 ? "pointer" : "default" }}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => { setSelected(qt); setViewOpen(true); }}>View</Button>
                  <Button size="small" onClick={() => { setForm({ ...qt }); setOpen(true); }}>Edit</Button>
                  {/* ✅ Convert to Invoice button — only for Accepted */}
                  {qt.status === "Accepted" && (
                    <Button size="small" color="success" variant="outlined"
                      onClick={() => handleConvertToInvoice(qt)}>
                      → Invoice
                    </Button>
                  )}
                  <Button size="small" color="error"
                    onClick={() => setQuotes(quotes.filter((q) => q.id !== qt.id))}>
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
        <DialogTitle>Change Quote Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current: <strong>{statusChangeQt?.status}</strong>
          </Typography>

          {/* ✅ Life cycle visual reminder */}
          <Box sx={{ bgcolor: "#f0f7ff", p: 1.5, borderRadius: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Life Cycle: Draft → Sent → Accepted → Invoiced
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↘ Rejected
            </Typography>
          </Box>

          <TextField
            select fullWidth label="Move to Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {(NEXT_STATUS[statusChangeQt?.status] || []).map((s) => (
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
          {form?.id} — New Quote
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

              {/* Quote # */}
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Quote #" value={form.id} disabled />
              </Grid>

              {/* Reference */}
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Reference #"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                />
              </Grid>

              {/* Dates */}
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Quote Date *" type="date"
                  value={form.quoteDate}
                  onChange={(e) => setForm({ ...form, quoteDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Expiry Date" type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Salesperson */}
              <Grid item xs={12} md={4}>
                <TextField
                  select fullWidth label="Salesperson"
                  value={form.salesperson}
                  onChange={(e) => setForm({ ...form, salesperson: e.target.value })}
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  {SALESPERSONS.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
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

            {/* Notes + Terms */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth multiline rows={3} label="Customer Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  helperText="Will be displayed on the quote"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth multiline rows={3} label="Terms & Conditions"
                  value={form.termsConditions}
                  onChange={(e) => setForm({ ...form, termsConditions: e.target.value })}
                  helperText="Enter terms and conditions of your business"
                />
              </Grid>
            </Grid>
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
          Quote Details — {selected?.id}
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
              <Grid item xs={3}>
                <Typography color="text.secondary">Quote Date</Typography>
                <Typography>{selected.quoteDate}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography color="text.secondary">Expiry Date</Typography>
                <Typography>{selected.expiryDate}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography color="text.secondary">Salesperson</Typography>
                <Typography>{selected.salesperson || "—"}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography color="text.secondary">Reference #</Typography>
                <Typography>{selected.reference || "—"}</Typography>
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
                <Typography color="text.secondary" fontWeight="bold">Customer Notes</Typography>
                <Typography>{selected.notes}</Typography>
              </Box>
            )}

            {selected.termsConditions && (
              <Box sx={{ mt: 1.5 }}>
                <Typography color="text.secondary" fontWeight="bold">Terms & Conditions</Typography>
                <Typography>{selected.termsConditions}</Typography>
              </Box>
            )}

            {/* ✅ Convert to Invoice from View dialog too */}
            {selected.status === "Accepted" && (
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" color="success"
                  onClick={() => { handleConvertToInvoice(selected); setViewOpen(false); }}>
                  Convert to Invoice →
                </Button>
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

export default Quotes;