import { useState, useEffect } from "react";
import axios from "axios";
import SalesChart from "./SalesChart";
import RecentInvoices from "../components/RecentInvoices";
import Footer from "../components/Footer";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

const API = axios.create({
  baseURL: "https://vjc-invoice-backend.vercel.app/api"
});

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function Dashboard() {
  const [kpis, setKpis] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    paymentsReceived: 0,
    pendingAmount: 0,
  });
  const [chartData, setChartData] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
  setLoading(true);

  try {
    const kpiRes = await API.get("/dashboard/kpis");
    setKpis(kpiRes.data.data);
  } catch (err) {
    console.log("KPI Error", err);
  }

  try {
    const chartRes = await API.get("/dashboard/sales-overview");
    setChartData(chartRes.data.data);
  } catch (err) {
    console.log("Chart Error", err);
  }

  try {
    const invRes = await API.get("/dashboard/recent-invoices");
    setRecentInvoices(invRes.data.data || []);
  } catch (err) {
    console.log("Invoice Error", err);
  }

  setLoading(false);
};
  const cards = [
    { title: "Total Customers", value: kpis.totalCustomers },
    { title: "Total Invoices", value: kpis.totalInvoices },
    { title: "Payments Received", value: fmt(kpis.paymentsReceived) },
    { title: "Pending Amount", value: fmt(kpis.pendingAmount) },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

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
              {fmt(kpis.paymentsReceived)}
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
              {fmt(kpis.pendingAmount)}
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
              {kpis.totalCustomers}
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
  <SalesChart data={chartData} />
</Box>

<Box sx={{ mt: 5 }}>
  <RecentInvoices invoices={recentInvoices} />
</Box>

<Box sx={{ mt: 5 }}>
  <Footer />
</Box>
    </div>
  );
}

export default Dashboard;