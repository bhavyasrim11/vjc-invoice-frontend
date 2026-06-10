import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssessmentIcon from "@mui/icons-material/Assessment";

const Sidebar = ({ setPage }) => {
  const menuItems = [
    { name: "Dashboard", icon: <DashboardIcon /> },
    { name: "Customers", icon: <PeopleIcon /> },
    { name: "Items", icon: <InventoryIcon /> },
    { name: "Quotes", icon: <RequestQuoteIcon /> },
    { name: "Invoices", icon: <ReceiptLongIcon /> },
    { name: "Payments Received", icon: <PaymentsIcon /> },
    { name: "Recurring Invoices", icon: <AutorenewIcon /> },
    { name: "Expenses", icon: <AccountBalanceWalletIcon /> },
    { name: "Time Tracking", icon: <AccessTimeIcon /> },
    { name: "Reports", icon: <AssessmentIcon /> },
  ];

  return (
    <div
      style={{
        width: "290px",
        height: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "20px",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      <h2
        style={{
          marginBottom: "30px",
          fontSize: "32px",
          fontWeight: "bold",
        }}
      >
        VJC Invoice
      </h2>

      {menuItems.map((item, index) => (
        <div
          key={item.name}
          onClick={() => setPage(item.name)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "14px",
            marginBottom: "10px",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "0.3s",
            background: index === 0 ? "#2563eb" : "transparent",
          }}
        >
          {item.icon}

          <span
            style={{
              fontSize: "18px",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;