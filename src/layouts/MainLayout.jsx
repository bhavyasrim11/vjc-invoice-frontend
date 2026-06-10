import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import Dashboard from "../pages/Dashboard";
import Customers from "../pages/Customers";
import Items from "../pages/Items";
import Quotes from "../pages/Quotes";
import Invoices from "../pages/Invoices";
import Payments from "../pages/Payments";
import RecurringInvoices from "../pages/RecurringInvoices";
import Expenses from "../pages/Expenses";
import TimeTracking from "../pages/TimeTracking";
import Reports from "../pages/Reports";

const MainLayout = () => {
  const [page, setPage] = useState("Dashboard");

  return (
    <div>
      <Sidebar setPage={setPage} />

      <div
        style={{
          flex: 1,
          marginLeft: "290px",
          height: "100vh",
          overflowY: "auto",
          background: "#f8fafc",
        }}
      >
        <Topbar />

        <div
          style={{
            padding: "25px",
          }}
        >
          {page === "Dashboard" && <Dashboard />}

          {page === "Customers" && <Customers />}

          {page === "Items" && <Items />}

          {page === "Quotes" && <Quotes />}

          {page === "Invoices" && <Invoices />}

          {page === "Payments Received" && <Payments />}

              {page === "Recurring Invoices" && <RecurringInvoices />}

               {page === "Expenses" && <Expenses />}

               {page === "Time Tracking" && <TimeTracking />}

               {page === "Reports" && <Reports />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;