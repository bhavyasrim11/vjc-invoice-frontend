import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  Button,
} from "@mui/material";

function RecentInvoices() {
  const invoices = [
    {
      id: "INV-001",
      customer: "Rahul Kumar",
      amount: "₹12,000",
      status: "Paid",
    },
    {
      id: "INV-002",
      customer: "Anjali Sharma",
      amount: "₹8,500",
      status: "Pending",
    },
    {
      id: "INV-003",
      customer: "Vikram Singh",
      amount: "₹15,000",
      status: "Paid",
    },
    {
      id: "INV-004",
      customer: "Priya Reddy",
      amount: "₹6,000",
      status: "Pending",
    },
  ];

  const handleViewAll = () => {
    alert("Invoices Page Coming Soon");
  };

  return (
    <Paper
      sx={{
        mt: 5,
        p: 3,
        borderRadius: 4,
        boxShadow: "0px 6px 15px rgba(0,0,0,0.08)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
        >
          Recent Invoices
        </Typography>

        <Button
          variant="text"
          onClick={handleViewAll}
          sx={{
            fontWeight: "bold",
            textTransform: "none",
            color: "#2563eb",
            fontSize: "15px",
          }}
        >
          View All →
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <b>Invoice No</b>
              </TableCell>

              <TableCell>
                <b>Customer Name</b>
              </TableCell>

              <TableCell align="right">
                <b>Amount</b>
              </TableCell>

              <TableCell>
                <b>Status</b>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                hover
                sx={{
                  "&:hover": {
                    backgroundColor: "#f8fafc",
                  },
                }}
              >
                <TableCell
                  sx={{
                    color: "#2563eb",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {invoice.id}
                </TableCell>

                <TableCell>
                  {invoice.customer}
                </TableCell>

                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  {invoice.amount}
                </TableCell>

                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={
                      invoice.status === "Paid"
                        ? "success"
                        : "warning"
                    }
                    size="small"
                    sx={{
                      fontWeight: "bold",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default RecentInvoices;