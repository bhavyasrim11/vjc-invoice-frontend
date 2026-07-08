import { useNavigate } from "react-router-dom";
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
import BadgeIcon from "@mui/icons-material/Badge";
import LogoutIcon from "@mui/icons-material/Logout";
import vjcLogo from "../assets/vjc-logo-badge.png";

const Sidebar = ({ setPage, activePage }) => {
  const navigate = useNavigate();
   const user = JSON.parse(
    localStorage.getItem("vjc_invoice_user")
  );
console.log("Logged User =", user);
  const menuItems =
  user?.role === "chairman"
    ? [
        { name: "Dashboard", icon: <DashboardIcon /> },
        { name: "Customers", icon: <PeopleIcon /> },
        { name: "Services", icon: <InventoryIcon /> },
        { name: "Quotes", icon: <RequestQuoteIcon /> },
        { name: "Invoices", icon: <ReceiptLongIcon /> },
        { name: "Payments Received", icon: <PaymentsIcon /> },
        { name: "Expenses", icon: <AccountBalanceWalletIcon /> },
{ name: "Reports", icon: <AssessmentIcon /> },
{ name: "All Employees", icon: <PeopleIcon /> },
        { name: "Add Employee", icon: <BadgeIcon /> },
      ]
    : [
        { name: "Dashboard", icon: <DashboardIcon /> },
        { name: "Customers", icon: <PeopleIcon /> },
        { name: "Quotes", icon: <RequestQuoteIcon /> },
        { name: "Invoices", icon: <ReceiptLongIcon /> },
        { name: "Payments Received", icon: <PaymentsIcon /> },
        { name: "Reports", icon: <AssessmentIcon /> },
      ];
      const nameToPermKey = {
    "Dashboard": "dashboard",
    "Customers": "customers",
    "Services": "services",
    "Quotes": "quotes",
    "Invoices": "invoices",
    "Payments Received": "payments",
    "Reports": "reports",
  };

  const finalMenuItems =
    user?.role === "chairman"
      ? menuItems
      : menuItems.filter((item) => user?.permissions?.[nameToPermKey[item.name]]);

  const handleLogout = () => {
    localStorage.removeItem("vjc_invoice_auth");
    navigate("/login");
  };

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
        display: "flex",
        flexDirection: "column",
      }}
    >
     <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" }}>
        <img src={vjcLogo} alt="VJC" style={{ width: "48px", height: "48px", objectFit: "contain" }} />
        <div>
         <h2
  style={{
    fontSize: "22px",
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
  }}
>
  VJC Overseas
</h2>
          <span style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#94a3b8", fontWeight: 500 }}>
            INVOICE PORTAL
          </span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {finalMenuItems.map((item, index) => (
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
              background:
                activePage === item.name
                  ? "#2563eb"
                  : index === 0 && !activePage
                  ? "#2563eb"
                  : "transparent",
            }}
            onMouseEnter={(e) => {
              if (activePage !== item.name) {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }
            }}
            onMouseLeave={(e) => {
              if (activePage !== item.name) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            {item.icon}
            <span style={{ fontSize: "18px", whiteSpace: "nowrap" }}>
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Logout Button - bottom lo */}
      <div
        onClick={handleLogout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "14px",
          marginTop: "10px",
          borderRadius: "10px",
          cursor: "pointer",
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.25)",
          color: "#f87171",
          transition: "0.3s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.22)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.12)";
        }}
      >
        <LogoutIcon />
        <span style={{ fontSize: "18px", whiteSpace: "nowrap" }}>Logout</span>
      </div>
    </div>
  );
};

export default Sidebar;
