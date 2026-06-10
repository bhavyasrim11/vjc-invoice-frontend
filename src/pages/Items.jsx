import { useState } from "react";

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";

// ✅ Price ko Indian format maa cheyyadam: 150000 → ₹1,50,000
const formatPrice = (value) => {
  if (!value) return "₹0";
  return Number(value).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
};

// ✅ GST amount calculate cheyyadam
const calcGST = (price, gstPercent) => {
  const p = parseFloat(price) || 0;
  const g = parseFloat(gstPercent) || 0;
  return Math.round((p * g) / 100);
};

function Items() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  const [viewOpen, setViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ✅ Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [items, setItems] = useState([
    {
      id: 1,
      serviceName: "Canada Study Visa",
      category: "Study Visa",
      country: "Canada",
      price: "150000",
      gst: "18",
      duration: "6 Months",
      documents: "Passport, Bank Statement, Offer Letter",
      description: "Complete study visa processing for Canada",
      status: "Active",
    },
    {
      id: 2,
      serviceName: "Australia PR",
      category: "PR Visa",
      country: "Australia",
      price: "250000",
      gst: "18",
      duration: "12 Months",
      documents: "Passport, Work Experience, IELTS Score",
      description: "Permanent Residency application for Australia",
      status: "Active",
    },
    {
      id: 3,
      serviceName: "UK Tourist Visa",
      category: "Tourist Visa",
      country: "United Kingdom",
      price: "65000",
      gst: "18",
      duration: "2 Months",
      documents: "Passport, Bank Statement, Hotel Booking",
      description: "Tourist visa processing for United Kingdom",
      status: "Inactive",
    },
  ]);

  const emptyForm = {
    serviceName: "",
    category: "",
    country: "",
    price: "",
    gst: "18",
    duration: "",
    documents: "",
    description: "",
    status: "Active",
  };

  const [newItem, setNewItem] = useState(emptyForm);

  // ✅ Validation
  const validate = (item) => {
    const e = {};
    if (!item.serviceName.trim()) e.serviceName = "Service name required";
    if (!item.category) e.category = "Category required";
    if (!item.country.trim()) e.country = "Country required";
    if (!item.price || isNaN(item.price) || Number(item.price) <= 0)
      e.price = "Valid price required";
    return e;
  };

  const handleAddItem = () => {
    const e = validate(newItem);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setItems([...items, { id: Date.now(), ...newItem }]);
    setNewItem(emptyForm);
    setErrors({});
    setOpen(false);
  };

  // ✅ Edit save
  const handleEditSave = () => {
    const e = validate(editItem);
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setItems(items.map((i) => (i.id === editItem.id ? editItem : i)));
    setErrors({});
    setEditOpen(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // ✅ Status toggle directly from table
  const handleStatusToggle = (id) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" }
          : item
      )
    );
  };

  const filteredItems = items.filter((item) =>
    item.serviceName.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = items.filter((i) => i.status === "Active").length;

  // ✅ Reusable form fields (used in both Add & Edit dialogs)
  const renderFormFields = (formData, setFormData) => (
    <>
      <TextField
        fullWidth
        margin="normal"
        label="Service Name *"
        value={formData.serviceName}
        error={!!errors.serviceName}
        helperText={errors.serviceName}
        onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
      />

      <TextField
        select
        fullWidth
        margin="normal"
        label="Category *"
        value={formData.category}
        error={!!errors.category}
        helperText={errors.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      >
        <MenuItem value="Study Visa">Study Visa</MenuItem>
        <MenuItem value="PR Visa">PR Visa</MenuItem>
        <MenuItem value="Tourist Visa">Tourist Visa</MenuItem>
        <MenuItem value="Job Seeker">Job Seeker</MenuItem>
        <MenuItem value="Business Visa">Business Visa</MenuItem>
        <MenuItem value="Work Permit">Work Permit</MenuItem>
      </TextField>

      <TextField
        fullWidth
        margin="normal"
        label="Country *"
        value={formData.country}
        error={!!errors.country}
        helperText={errors.country}
        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
      />

      {/* ✅ Price + GST side by side */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            margin="normal"
            label="Price (₹) *"
            value={formData.price}
            error={!!errors.price}
            helperText={errors.price || (formData.price ? `GST: ₹${calcGST(formData.price, formData.gst).toLocaleString("en-IN")}` : "")}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            select
            fullWidth
            margin="normal"
            label="GST %"
            value={formData.gst}
            onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
          >
            <MenuItem value="0">0% (Exempt)</MenuItem>
            <MenuItem value="5">5%</MenuItem>
            <MenuItem value="12">12%</MenuItem>
            <MenuItem value="18">18%</MenuItem>
            <MenuItem value="28">28%</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* ✅ Total amount preview */}
      {formData.price && Number(formData.price) > 0 && (
        <Box sx={{ bgcolor: "#f0f7ff", p: 1.5, borderRadius: 1, mt: 0.5, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Base Price: {formatPrice(formData.price)} &nbsp;+&nbsp;
            GST ({formData.gst}%): ₹{calcGST(formData.price, formData.gst).toLocaleString("en-IN")} &nbsp;=&nbsp;
            <strong>Total: {formatPrice(Number(formData.price) + calcGST(formData.price, formData.gst))}</strong>
          </Typography>
        </Box>
      )}

      <TextField
        fullWidth
        margin="normal"
        label="Duration (e.g. 3 Months)"
        value={formData.duration}
        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
      />

      <TextField
        fullWidth
        multiline
        rows={2}
        margin="normal"
        label="Required Documents"
        value={formData.documents}
        onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
      />

      <TextField
        fullWidth
        multiline
        rows={2}
        margin="normal"
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <TextField
        select
        fullWidth
        margin="normal"
        label="Status"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
      >
        <MenuItem value="Active">Active</MenuItem>
        <MenuItem value="Inactive">Inactive</MenuItem>
      </TextField>
    </>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Services / Items
      </Typography>

      {/* ✅ Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #1976d2" }}>
            <CardContent>
              <Typography color="text.secondary">Total Services</Typography>
              <Typography variant="h5" fontWeight="bold">{items.length}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #2e7d32" }}>
            <CardContent>
              <Typography color="text.secondary">Active Services</Typography>
              <Typography variant="h5" fontWeight="bold">{activeCount}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #ed6c02" }}>
            <CardContent>
              <Typography color="text.secondary">Most Sold</Typography>
              <Typography variant="h5" fontWeight="bold">Study Visa</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderLeft: "4px solid #9c27b0" }}>
            <CardContent>
              <Typography color="text.secondary">Revenue</Typography>
              <Typography variant="h5" fontWeight="bold">₹25,00,000</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ Search + Add Button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", my: 4 }}>
        <TextField
          label="Search Service"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: "300px" }}
        />
        <Button variant="contained" onClick={() => { setErrors({}); setOpen(true); }}>
          + Add Service
        </Button>
      </Box>

      {/* ✅ Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell><strong>Service</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Country</strong></TableCell>
              <TableCell><strong>Price</strong></TableCell>
              <TableCell><strong>GST</strong></TableCell>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>{item.serviceName}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.country}</TableCell>
                <TableCell>{formatPrice(item.price)}</TableCell>
                <TableCell>{item.gst || 18}%</TableCell>
                <TableCell>
                  {formatPrice(Number(item.price) + calcGST(item.price, item.gst || 18))}
                </TableCell>
                <TableCell>
                  {/* ✅ Clickable status chip to toggle */}
                  <Chip
                    label={item.status}
                    color={item.status === "Active" ? "success" : "default"}
                    size="small"
                    onClick={() => handleStatusToggle(item.id)}
                    sx={{ cursor: "pointer" }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => { setSelectedItem(item); setViewOpen(true); }}
                  >
                    View
                  </Button>

                  {/* ✅ Edit button now works */}
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => {
                      setEditItem({ ...item });
                      setErrors({});
                      setEditOpen(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ ADD Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Service</DialogTitle>
        <DialogContent>
          {renderFormFields(newItem, setNewItem)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setErrors({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddItem}>Save Service</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ EDIT Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Service</DialogTitle>
        <DialogContent>
          {editItem && renderFormFields(editItem, setEditItem)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditOpen(false); setErrors({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Update Service</Button>
        </DialogActions>
      </Dialog>

      {/* ✅ VIEW Dialog — full details */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Service Details</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
              {[
                ["Service Name", selectedItem.serviceName],
                ["Category", selectedItem.category],
                ["Country", selectedItem.country],
                ["Base Price", formatPrice(selectedItem.price)],
                ["GST", `${selectedItem.gst || 18}%  (₹${calcGST(selectedItem.price, selectedItem.gst || 18).toLocaleString("en-IN")})`],
                ["Total (with GST)", formatPrice(Number(selectedItem.price) + calcGST(selectedItem.price, selectedItem.gst || 18))],
                ["Duration", selectedItem.duration || "—"],
                ["Documents", selectedItem.documents || "—"],
                ["Description", selectedItem.description || "—"],
                ["Status", selectedItem.status],
              ].map(([label, value]) => (
                <Box key={label} sx={{ display: "flex", gap: 1 }}>
                  <Typography fontWeight="bold" sx={{ minWidth: 150 }}>{label}:</Typography>
                  <Typography>{value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Items;