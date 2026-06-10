import {
  Box,
  Grid,
  Typography,
  Divider,
} from "@mui/material";

function Footer() {
  return (
    <Box
      sx={{
        mt: 5,
        px: 6,
        py: 5,
        background: "#ffffff",
        borderRadius: "24px",
        boxShadow:
          "0px 8px 24px rgba(15,23,42,0.08)",
      }}
    >
      <Grid
        container
        spacing={6}
        alignItems="flex-start"
      >
        {/* Left Section */}

        <Grid item xs={12} md={6}>
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              mb: 2,
              color: "#0f172a",
            }}
          >
            VJC Invoice Software
          </Typography>

          <Typography
            sx={{
              color: "#64748b",
              maxWidth: "420px",
              lineHeight: 1.9,
              fontSize: "15px",
            }}
          >
            Professional CRM and invoice
            management solution designed for
            growing businesses. Manage
            customers, invoices, payments,
            reports, and business operations
            from one powerful dashboard.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography
              sx={{
                color: "#2563eb",
                fontWeight: 600,
              }}
            >
              info@vjcoverseas.com
            </Typography>
          </Box>
        </Grid>

        {/* Product */}

        <Grid item xs={6} md={3}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            Product
          </Typography>

          {[
            "Dashboard",
            "Customers",
            "Invoices",
            "Reports",
          ].map((item) => (
            <Typography
              key={item}
              sx={{
                mb: 1.5,
                color: "#64748b",
                cursor: "pointer",
                transition: "0.3s",
                "&:hover": {
                  color: "#2563eb",
                },
              }}
            >
              {item}
            </Typography>
          ))}
        </Grid>

        {/* Support */}

        <Grid item xs={6} md={3}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ mb: 2 }}
          >
            Support
          </Typography>

          <Typography
            sx={{
              mb: 1.5,
              color: "#64748b",
            }}
          >
            Help Center
          </Typography>

          <Typography
            sx={{
              mb: 1.5,
              color: "#64748b",
            }}
          >
            Documentation
          </Typography>

          <Typography
            sx={{
              mb: 1.5,
              color: "#64748b",
            }}
          >
            Contact Support
          </Typography>

          <Typography
            sx={{
              color: "#16a34a",
              fontWeight: 600,
              mt: 2,
            }}
          >
            ● System Status: Online
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
        >
          © 2026 VJC Invoice Software
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Version 1.0 • Built with React &
          Material UI
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;