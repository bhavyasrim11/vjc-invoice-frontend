import SalesChart from "./SalesChart";
import RecentInvoices from "../components/RecentInvoices";
import Footer from "../components/Footer";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";

function Dashboard() {
  const cards = [
    {
      title: "Total Customers",
      value: "120",
    },
    {
      title: "Total Invoices",
      value: "350",
    },
    {
      title: "Payments Received",
      value: "₹8,50,000",
    },
    {
      title: "Pending Amount",
      value: "₹1,20,000",
    },
  ];

  return (
    <div>
      {/* Welcome Banner */}

      <Box
        sx={{
          background:
            "linear-gradient(135deg, #1e3a8a, #7c3aed)",
          color: "white",
          p: 4,
          borderRadius: 4,
          mb: 4,
          boxShadow: "0px 8px 20px rgba(0,0,0,0.12)",
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
        >
          👋 Good Afternoon, Mani
        </Typography>

        <Typography
          sx={{
            mt: 1,
            opacity: 0.9,
            fontSize: "14px",
          }}
        >
          Welcome back to VJC Invoice Software
        </Typography>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Typography
              variant="body2"
              sx={{ opacity: 0.8 }}
            >
              Total Revenue
            </Typography>

            <Typography
              variant="h6"
              fontWeight="bold"
            >
              ₹8,50,000
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography
              variant="body2"
              sx={{ opacity: 0.8 }}
            >
              Pending Amount
            </Typography>

            <Typography
              variant="h6"
              fontWeight="bold"
            >
              ₹1,20,000
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography
              variant="body2"
              sx={{ opacity: 0.8 }}
            >
              Total Customers
            </Typography>

            <Typography
              variant="h6"
              fontWeight="bold"
            >
              120
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Business Overview */}

<Typography
  variant="h4"
  fontWeight="700"
  sx={{
    mb: 4,
    mt: 2,
    color: "#111827",
  }}
>
  Business Overview
</Typography>

      {/* KPI Cards */}

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
            key={card.title}
          >
            <Card
              sx={{
                borderRadius: 4,
                boxShadow:
                  "0px 4px 12px rgba(0,0,0,0.08)",
                minHeight: "110px",
                transition: "0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {card.title}
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sales Chart */}

     <Box sx={{ mt: 5 }}>
  <SalesChart />
</Box>

<Box sx={{ mt: 5 }}>
  <RecentInvoices />
</Box>

<Box sx={{ mt: 5 }}>
  <Footer />
</Box>
    </div>
  );
}

export default Dashboard;