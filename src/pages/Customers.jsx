import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Chip, Avatar, Tabs, Tab, Divider,
  Stack, CircularProgress, Alert, IconButton, InputAdornment
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const API = "https://vjc-invoice-backend.vercel.app/api";

const statusColor = (s) => s === "Active" ? "success" : s === "Inactive" ? "default" : "warning";
const typeColor = (t) => t === "Business" ? "primary" : "secondary";
const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
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

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD"];
const INVOICE_TYPES = ["Including Tax", "Excluding Tax"];
const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];

const EMPTY_FORM = {
  type: "Business",
  status: "Active",
  name: "",
  service_type: "",
  service_id: "",   // NEW
  phone: "",
  email: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  notes: "",
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
  <Button
    size="small"
    variant="contained"
    onClick={() => { onCreateInvoice(customer); onClose(); }}
  >
    + Create Invoice
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
  const [errors, setErrors] = useState({});
  const [services, setServices] = useState([]);
  useEffect(() => { setForm(initial || EMPTY_FORM); }, [initial, open]);
  useEffect(() => {
  if (!open) return;

  fetch(`${API}/items`,  {
  headers: { Authorization: `Bearer ${localStorage.getItem("vjc_invoice_auth")}` }
})
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setServices(data.items || []);
      }
    })
    .catch((err) => console.log("Services load error", err));
}, [open]);
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const validateForm = () => {
  const newErrors = {};

  if (!form.type) newErrors.type = "Customer Type is required";
  if (!form.status) newErrors.status = "Status is required";
  if (!form.name?.trim()) newErrors.name = "Customer Name is required";
  if (!form.service_type) newErrors.service_type = "Service Type is required";
  if (!form.phone?.trim()) newErrors.phone = "Phone is required";
  if (!form.email?.trim()) newErrors.email = "Email is required";
  if (!form.gstin?.trim()) newErrors.gstin = "GST Number is required";
  if (!form.address?.trim()) newErrors.address = "Address is required";
  if (!form.city?.trim()) newErrors.city = "City is required";
  if (!form.state?.trim()) newErrors.state = "State is required";

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

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
<TextField
  fullWidth
  margin="normal"
  label="Customer Name *"
  value={form.name}
  onChange={set("name")}
  error={!!errors.name}
  helperText={errors.name}
/>       <TextField
  select
  fullWidth
  margin="normal"
  label="Service Type"
  value={form.service_id || ""}
  onChange={(e) => {
    const selected = services.find(
      (s) => String(s.id) === String(e.target.value)
    );

    setForm({
      ...form,
      service_id: e.target.value,
      service_type: selected?.service_name || "",
    });
  }}
  error={!!errors.service_type}
  helperText={errors.service_type}
>
  {services.map((s) => (
    <MenuItem key={s.id} value={s.id}>
      {s.service_name}
    </MenuItem>
  ))}
</TextField>
<TextField fullWidth margin="normal" label="Phone" value={form.phone} onChange={set("phone")} error={!!errors.phone} helperText={errors.phone} />
<TextField fullWidth margin="normal" label="Email" value={form.email} onChange={set("email")} error={!!errors.email} helperText={errors.email} />
<TextField
  fullWidth
  margin="normal"
  label="GST Number *"
  value={form.gstin}
  onChange={set("gstin")}
  error={!!errors.gstin}
  helperText={errors.gstin}
/>        <TextField fullWidth margin="normal" label="Address" multiline rows={2} value={form.address} onChange={set("address")} error={!!errors.address} helperText={errors.address} />

        <Grid container spacing={1}>
          <Grid item xs={6}>
<TextField fullWidth margin="normal" label="City" value={form.city} onChange={set("city")} error={!!errors.city} helperText={errors.city} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth margin="normal" label="State" value={form.state} onChange={set("state")} error={!!errors.state} helperText={errors.state}>

              {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
        <TextField fullWidth margin="normal" label="Notes" multiline rows={2} value={form.notes} onChange={set("notes")} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
<Button
  variant="contained"
  onClick={() => {
    if (validateForm()) {
      onSave(form);
      onClose();
    }
  }}
>          {title.startsWith("Edit") ? "Update Customer" : "Save Customer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Invoice Dialog (matches "Create Client Invoices" template) ─────────────
const FieldRow = ({ label, required, children }) => (
  <Box sx={{
    display: "flex",
    alignItems: "center",
    py: 1.2,
    borderBottom: "1px solid #f0f0f0",
  }}>
    <Typography sx={{
      width: 155,
      minWidth: 155,
      fontWeight: 700,
      fontSize: 13.5,
      color: "#222",
    }}>
      {label}{required && <span style={{ color: "#d32f2f" }}> *</span>}
    </Typography>
    <Box sx={{ flex: 1 }}>{children}</Box>
  </Box>
);
const todayStr = () => new Date().toISOString().split("T")[0];

const EMPTY_INVOICE_FORM = {
  invoiceType: "Including Tax",
  currency: "INR",
  invoiceDate: todayStr(),
  paymentMode: "",
  totalAmount: "",
  discount: "0",
  dueDate: "",
  serviceType: "",
  stateBy: "",
  description: "",
  paidAmount: "",
  referenceNo: "",
};

function InvoiceDialog({ open, onClose, customer, onSuccess }) {
  const [form, setForm] = useState(EMPTY_INVOICE_FORM);
const [loading, setLoading] = useState(false);
const [invoiceErrors, setInvoiceErrors] = useState({});
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
  if (open) {
    setForm({ ...EMPTY_INVOICE_FORM });
    setCustomerSearch("");
    setSelectedCustomer(null);
    setSearchOpen(false);
  }
}, [open]);

useEffect(() => {
  if (!open) return;

  const token = localStorage.getItem("vjc_invoice_auth");
fetch(`${API}/customers`, {
  headers: { Authorization: `Bearer ${token}` },
})
    .then((r) => r.json())
    .then((d) => {
  console.log("CUSTOMERS API RESPONSE =", d);
  console.log("FULL JSON =", JSON.stringify(d, null, 2));

  console.log("FULL RESPONSE =", d);
setCustomerOptions(d.customers || []);
})
    .catch((err) => {
      console.log("CUSTOMER API ERROR =", err);
    });
}, [open]);

  const activeCustomer = selectedCustomer || customer;

  const taxPercent = 18;
  const totalAmountNum = Number(form.totalAmount || 0);
  const discountNum = Number(form.discount || 0);
  const paidAmountNum = Number(form.paidAmount || 0);
  const invoiceAmount = Math.max(totalAmountNum - discountNum, 0);

  let taxAmount = 0;
  let grandTotal = 0;
  if (form.invoiceType === "Including Tax") {
    taxAmount = invoiceAmount - invoiceAmount / (1 + taxPercent / 100);
    grandTotal = invoiceAmount;
  } else {
    taxAmount = (invoiceAmount * taxPercent) / 100;
    grandTotal = invoiceAmount + taxAmount;
  }
  const balanceAmount = Math.max(grandTotal - paidAmountNum, 0);

  // Show attachment field once paid amount has at least 1 digit
  const showAttachment = form.paidAmount && form.paidAmount.length > 0;

const set = (field) => (e) =>
  setForm((prev) => ({
    ...prev,
    [field]: e.target.value,
  }));
  const handleSubmit = async () => {
    const errs = {};
    if (!activeCustomer) errs.clientName = "Client is required";
    if (!form.totalAmount) errs.totalAmount = "Total Amount is required";
    if (!form.paymentMode) errs.paymentMode = "Payment Mode is required";
    if (needsRef && !form.referenceNo?.trim()) errs.referenceNo = `${refLabel} is required`;
    if (balanceAmount > 0 && !form.dueDate) errs.dueDate = "Due Date is required";
    if (!form.serviceType) errs.serviceType = "Service Type is required";
    if (!form.stateBy) errs.stateBy = "State By is required";
    if (Object.keys(errs).length > 0) { setInvoiceErrors(errs); return; }
    setInvoiceErrors({});

    setLoading(true);
    try {
const token = localStorage.getItem("vjc_invoice_auth");
const res = await fetch(`${API}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customer_id: activeCustomer.id,
          customer_name: activeCustomer.name,
          customer_email: activeCustomer.email,
          invoice_type: form.invoiceType,
          currency: form.currency,
          invoice_date: form.invoiceDate,
          payment_mode: form.paymentMode,
          reference_no: form.referenceNo || null,
          items: [{ description: form.description, amount: invoiceAmount }],
          total_amount: totalAmountNum,
          discount: discountNum,
          subtotal: invoiceAmount,
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          grand_total: grandTotal,
          paid_amount: paidAmountNum,
          balance_amount: balanceAmount,
due_date: balanceAmount > 0 ? form.dueDate : null,
          service_type: form.serviceType,
          state_by: form.stateBy,
          notes: form.description,
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert("✅ Invoice created! Email sent to Chairman successfully!");
        setForm({ ...EMPTY_INVOICE_FORM });
        onSuccess && onSuccess(activeCustomer.id);
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

  const readOnlyStyle = {
    "& .MuiInputBase-root": { bgcolor: "#f0f1f3" },
    "& .MuiInputBase-input": { color: "#888" },
  };

  

  // Filter by name, customer_id, email, phone
  console.log("CUSTOMER OPTIONS =", customerOptions);
  const filteredCustomers =
  customerSearch.length >= 1
    ? customerOptions.filter((c) => {
        const q = customerSearch.toLowerCase();

        return (
          c.name?.toLowerCase().includes(q) ||
          c.customer_id?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toString().includes(q)
        );
      })
    : [];

  const needsRef = ["UPI", "Bank Transfer", "Cheque"].includes(form.paymentMode);
  const refLabel = form.paymentMode === "UPI"
    ? "UTR / Reference No"
    : form.paymentMode === "Cheque"
    ? "Cheque No"
    : "Reference No";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}>

      {/* Teal header */}
      <Box sx={{
        bgcolor: "#0f9b8e", color: "#fff", px: 3, py: 2,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderRadius: "8px 8px 0 0",
      }}>
        <Typography variant="h6" fontWeight={700} fontSize={18}>
          Create Client Invoices
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 4, pt: 3, pb: 1 }}>

        {/* Top row */}
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2, mb: 1 }}>

          {/* Client Name — searchable, image-3 style */}
          <Box sx={{ flex: 2, position: "relative" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#555", mb: 0.5 }}>
              Client Name <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <TextField
              fullWidth size="small"
placeholder="Type customer name..."
value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomer(null);
                setSearchOpen(true);
              }}
onFocus={() => {
  if (customerSearch.length >= 1) {
    setSearchOpen(true);
  }
}}
               error={!!invoiceErrors.clientName}
              helperText={invoiceErrors.clientName}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {selectedCustomer ? (
                      <IconButton size="small" onClick={() => {
                        setSelectedCustomer(null);
                        setCustomerSearch("");
                        setSearchOpen(false);
                      }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      // dropdown arrow icon
                      <Box sx={{ color: "#aaa", fontSize: 18, pr: 0.5, pointerEvents: "none" }}>▾</Box>
                    )}
                  </InputAdornment>
                ),
              }}
            />

            {/* Dropdown list — image 3 style */}
            {searchOpen && !selectedCustomer && (
              <Paper sx={{
                position: "absolute", top: "100%", left: 0, right: 0,
                zIndex: 9999, maxHeight: 220, overflowY: "auto",
                border: "1px solid #ddd", boxShadow: 4,
              }}>
                {filteredCustomers.length === 0 ? (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {customerSearch.length === 0
                        ? "Please enter 1 or more characters"
                        : "No customers found"}
                    </Typography>
                  </Box>
                ) : (
                  filteredCustomers.map((c, idx) => (
                    <Box
                      key={c.id}
                      onClick={() => {
setSelectedCustomer(c);

setCustomerSearch(
  `[${c.customer_id}] ${c.name}` +
  (c.email ? ` | ${c.email}` : "") +
  (c.phone ? ` | ${c.phone}` : "")
);

setSearchOpen(false);
                      }}
                      sx={{
                        px: 2, py: 1.1, cursor: "pointer",
                        bgcolor: idx === 0 ? "#1565c0" : "#fff",
                        color: idx === 0 ? "#fff" : "#222",
                        "&:hover": {
                          bgcolor: idx === 0 ? "#1565c0" : "#f0f7ff",
                        },
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <Typography variant="body2" fontWeight={500} fontSize={13}>
                       [{c.customer_id}] {c.name}
{c.email ? ` | ${c.email}` : ""}
{c.phone ? ` | ${c.phone}` : ""}
                     
                      </Typography>
                    </Box>
                  ))
                )}
              </Paper>
            )}
          </Box>

          {/* Gap */}
          <Box sx={{ flex: 1 }} />

          {/* Invoice Type */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#555", mb: 0.5 }}>
              Invoice Type
            </Typography>
            <TextField select fullWidth size="small" value={form.invoiceType} onChange={set("invoiceType")}>
              {INVOICE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Box>

          {/* Currency */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#555", mb: 0.5 }}>
              Currency <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <TextField
              select fullWidth size="small" value={form.currency} onChange={set("currency")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ mr: 1 }}>
                    <CheckCircleIcon fontSize="small" sx={{ color: "#2e7d32" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "#2e7d32", borderStyle: "dashed" } }}
            >
              {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Box>

          {/* Invoice Date */}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#555", mb: 0.5 }}>
              Invoice Date <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <TextField
              fullWidth size="small" type="date"
              InputLabelProps={{ shrink: true }}
              value={form.invoiceDate}
              onChange={set("invoiceDate")}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Two-column body */}
        <Box sx={{ display: "flex", gap: 6 }}>

          {/* LEFT */}
          <Box sx={{ flex: 1 }}>
            <FieldRow label="Payment Mode" required>
<TextField
                select fullWidth size="small" value={form.paymentMode}
                onChange={(e) =>
  setForm((prev) => ({
    ...prev,
    paymentMode: e.target.value,
    referenceNo: "",
  }))
}
                error={!!invoiceErrors.paymentMode}
                helperText={invoiceErrors.paymentMode}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="" disabled><em>Select Option</em></MenuItem>
                {PAYMENT_MODES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </FieldRow>

            {needsRef && (
              <FieldRow label={refLabel} required>
                <TextField
  fullWidth
  size="small"
  placeholder={`Enter ${refLabel}`}
  value={form.referenceNo || ""}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      referenceNo: e.target.value,
    }))
  }
  error={!!invoiceErrors.referenceNo}
  helperText={invoiceErrors.referenceNo}
/>
              </FieldRow>
            )}

            {/* Total Amount — plain text, no type=number, no focus jump */}
            <FieldRow label="Total Amount" required>
              <TextField
                fullWidth size="small"
                placeholder="Total Amount"
               defaultValue=""
onChange={(e) => console.log(e.target.value)}
onBlur={(e) => setForm(prev => ({ ...prev, totalAmount: e.target.value.replace(/[^0-9.]/g, "") }))}
inputProps={{ inputMode: "decimal" }}
error={!!invoiceErrors.totalAmount}
helperText={invoiceErrors.totalAmount}
              />
            </FieldRow>

            <FieldRow label="Discount">
              <TextField
                fullWidth size="small"
                value={form.discount}
                // AFTER
onChange={(e) => setForm(prev => ({ ...prev, discount: e.target.value }))}
onBlur={(e) => setForm(prev => ({ ...prev, discount: e.target.value.replace(/[^0-9.]/g, "") }))}
                inputProps={{ inputMode: "decimal" }}
              />
            </FieldRow>

            <FieldRow label="Invoice Amount">
              <TextField
                fullWidth size="small"
                value={invoiceAmount ? invoiceAmount.toLocaleString("en-IN") : ""}
                placeholder="Invoice Amount"
                InputProps={{ readOnly: true }}
                sx={readOnlyStyle}
              />
            </FieldRow>

            <FieldRow label="TAX (%)">
              <TextField
                fullWidth size="small"
                value={taxPercent}
                InputProps={{ readOnly: true }}
                sx={readOnlyStyle}
              />
            </FieldRow>

            <FieldRow label="TAX Amount">
              <TextField
                fullWidth size="small"
                value={taxAmount ? taxAmount.toFixed(2) : "0.0"}
                InputProps={{ readOnly: true }}
                sx={readOnlyStyle}
              />
            </FieldRow>
          </Box>

          {/* RIGHT */}
          <Box sx={{ flex: 1 }}>
            <FieldRow label="Grand Total">
              <TextField
                fullWidth size="small"
                value={grandTotal ? grandTotal.toLocaleString("en-IN") : ""}
                placeholder="Grand Total"
                InputProps={{ readOnly: true }}
                sx={readOnlyStyle}
              />
            </FieldRow>

            {/* Paid Amount — plain text, Full Pay button */}
            <FieldRow label="Paid Amount">
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
  fullWidth
  size="small"
  placeholder="Paid Amount"
  value={form.paidAmount || ""}
  onChange={(e) => setForm(prev => ({ ...prev, paidAmount: e.target.value }))}
  onBlur={(e) => setForm(prev => ({ ...prev, paidAmount: e.target.value.replace(/[^0-9.]/g, "") }))}
  inputProps={{ inputMode: "decimal" }}
                  InputProps={{
                    endAdornment: form.paidAmount && Number(form.paidAmount) === grandTotal && grandTotal > 0 ? (
                      <InputAdornment position="end">
                        <CheckCircleIcon fontSize="small" sx={{ color: "#2e7d32" }} />
                      </InputAdornment>
                    ) : null,
                  }}
                />
                {grandTotal > 0 && Number(form.paidAmount) !== grandTotal && (
                  <Button
                    size="small" variant="outlined" color="success"
                   onClick={() =>
  setForm((prev) => ({
    ...prev,
    paidAmount: String(grandTotal),
  }))
}
                    sx={{ whiteSpace: "nowrap", fontSize: 11, px: 1.5, minWidth: "auto" }}
                  >
                    Full Pay
                  </Button>
                )}
              </Box>
            </FieldRow>

            <FieldRow label="Balance Amount">
              <TextField
                fullWidth size="small"
                value={form.totalAmount ? balanceAmount.toLocaleString("en-IN") : ""}
                placeholder="Balance Amount"
                InputProps={{ readOnly: true }}
                sx={readOnlyStyle}
              />
            </FieldRow>

{balanceAmount > 0 && (
  <FieldRow label="Due Date" required>
     <TextField
      fullWidth
      size="small"
      type="date"
      InputLabelProps={{ shrink: true }}
      value={form.dueDate}
      onChange={set("dueDate")}
      error={!!invoiceErrors.dueDate}
      helperText={invoiceErrors.dueDate}
    />

  </FieldRow>
)}

            {/* Attachment — appears only after paid amount has been entered */}
            {showAttachment && (
              <FieldRow label="Attachment" required>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ fontSize: 13 }}
                  onChange={(e) => setForm({ ...form, attachment: e.target.files[0] || null })}
                />
              </FieldRow>
            )}

            <FieldRow label="Service Type" required>
              <TextField
                select fullWidth size="small" value={form.serviceType}
                onChange={set("serviceType")}
                error={!!invoiceErrors.serviceType}
                helperText={invoiceErrors.serviceType}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="" disabled><em>Select Option</em></MenuItem>
                {VJC_SERVICES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FieldRow>

            <FieldRow label="State By" required>
              <TextField
                select fullWidth size="small" value={form.stateBy}
                onChange={set("stateBy")}
                error={!!invoiceErrors.stateBy}
                helperText={invoiceErrors.stateBy}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="" disabled><em>Select Option</em></MenuItem>
                {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </FieldRow>

            <FieldRow label="Description">
              <TextField
                fullWidth size="small"
                placeholder="Description"
                value={form.description}
                onChange={set("description")}
              />
            </FieldRow>
          </Box>
        </Box>
      </DialogContent>

      <Divider sx={{ mt: 2 }} />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained" onClick={onClose}
          sx={{ bgcolor: "#e57373", "&:hover": { bgcolor: "#ef5350" }, px: 3, textTransform: "uppercase" }}
        >
          Close
        </Button>
        <Button
          variant="contained" onClick={handleSubmit} disabled={loading}
          sx={{ bgcolor: "#0f9b8e", "&:hover": { bgcolor: "#0c8276" }, px: 3 }}
        >
          {loading ? "Sending..." : "Create Invoice →"}
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
      return alert(`❌ Payment amount cannot be greater than the outstanding balance. Outstanding: ${fmt(customer.outstanding)}`);
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

  // Tracks customer ids that already have an invoice created in this session,
  // as a safety net on top of whatever the backend reports (invoice_created /
  // has_invoice / invoice_count / last_invoice_id on the customer record).
  const [invoicedIds, setInvoicedIds] = useState(() => {
    try {
      const raw = window.localStorage?.getItem("vjc_invoiced_customer_ids");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const persistInvoicedIds = (nextSet) => {
    try {
      window.localStorage?.setItem("vjc_invoiced_customer_ids", JSON.stringify([...nextSet]));
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  };

  // Determine, using whatever signal is available, whether a customer
  // already has an invoice created for them.
const hasExistingInvoice = (customer) => {
  if (!customer) return false;

  // Partial paid unte — allow second invoice
  if (Number(customer.outstanding || 0) > 0) return false;

  // Full paid unte — block
  if (invoicedIds.has(customer.id)) return true;
  if (customer.invoice_created) return true;
  if (customer.has_invoice) return true;
  if (Number(customer.invoice_count || 0) > 0) return true;
  if (customer.last_invoice_id) return true;
  return false;
};

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterStatus !== "All") params.append("status", filterStatus);
      if (filterType !== "All") params.append("type", filterType);
      const token = localStorage.getItem("vjc_invoice_auth");
const res = await fetch(`${API}/customers?${params}`, {
  headers: { Authorization: `Bearer ${token}` },
});
      const data = await res.json();
      if (data.success) { setCustomers(data.customers); setStats(data.stats); }
    } catch (err) {
      setError("Unable to connect to backend server!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     fetchCustomers();
     }, [search, filterStatus, filterType]);
    
  const handleAdd = async (form) => {
    try {
      const token = localStorage.getItem("vjc_invoice_auth");
const res = await fetch(`${API}/customers`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(form),
});
      const data = await res.json();
      if (data.success) fetchCustomers();
      else alert(data.message);
    } catch { alert("Failed to add customer"); }
  };

  const handleEdit = async (form) => {
    try {
const token = localStorage.getItem("vjc_invoice_auth");
const res = await fetch(`${API}/customers/${selected.id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(form),
});
      const data = await res.json();
      if (data.success) fetchCustomers();
      else alert(data.message);
    } catch { alert("Failed to update customer"); }
  };

  const handleInvoiceButtonClick = (customer) => {
    if (hasExistingInvoice(customer)) {
      alert("❌ Already invoice created");
      return;
    }
    setSelected(customer);
    setInvoiceOpen(true);
  };

  const handleInvoiceSuccess = (customerId) => {
    const next = new Set(invoicedIds);
    next.add(customerId);
    setInvoicedIds(next);
    persistInvoicedIds(next);
    fetchCustomers();
  };
  const sortedCustomers = [...customers];

const displayCustomers = sortedCustomers.filter((customer) => {
  if (filterStatus === "Paid") {
    return Number(customer.outstanding || 0) === 0;
  }

  if (filterStatus === "Pending") {
    return Number(customer.outstanding || 0) > 0;
  }

  return true;
});



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
<TextField
  select
  label="Payment"
  size="small"
  value={filterStatus}
  onChange={(e) => setFilterStatus(e.target.value)}
  sx={{ width: 130 }}
>
  {["All", "Paid", "Pending"].map((s) => (
    <MenuItem key={s} value={s}>
      {s}
    </MenuItem>
  ))}
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
   <>
<TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table
            sx={{
              "& th, & td": {
                borderRight: "1px solid #e5e7eb",
              },
              "& th:last-child, & td:last-child": {
                borderRight: "none",
              },
            }}
          >
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Customer ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Service Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment </TableCell>
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
{displayCustomers.map((customer) => (
  
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
  {customer.invoice_status === "Approved" && (
    <Chip
      label={
        Number(customer.outstanding || 0) === 0
          ? "Paid"
          : "Partial Paid"
      }
      color={
        Number(customer.outstanding || 0) === 0
          ? "success"
          : "warning"
      }
      size="small"
    />
  )}
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
                        onClick={() => handleInvoiceButtonClick(customer)}>
                        Invoice
                      </Button>
                    <Chip
  label={customer.invoice_status || "Pending"}
  color={
    customer.invoice_status === "Approved"
      ? "success"
      : customer.invoice_status === "Rejected"
      ? "warning"
      : "error"
  }
  size="small"
/>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
      </>
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
        onCreateInvoice={(c) => handleInvoiceButtonClick(c)}
        onRecordPayment={(c) => { setSelected(c); setPaymentOpen(true); }}
      />

      <InvoiceDialog
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        customer={selected}
        onSuccess={handleInvoiceSuccess}
      />

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
