import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import Dashboard from "../pages/Dashboard";
import Customers from "../pages/Customers";
import Items from "../pages/Items";
import Quotes from "../pages/Quotes";
import Invoices from "../pages/Invoices";
import Payments from "../pages/Payments";

import Expenses from "../pages/Expenses";

import Reports from "../pages/Reports";
import Employees from "../pages/Employees";   
import AllEmployees from "../pages/AllEmployees.jsx";
const MainLayout = () => {
  const [page, setPage] = useState("Dashboard");

  return (
    <div>
      <Sidebar
  setPage={(value) => {
    console.log("Clicked =", value);
    setPage(value);
  }}
/>

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

          {page === "Services" && <Items />}

          {page === "Quotes" && <Quotes />}

          {page === "Invoices" && <Invoices />}

          {page === "Payments Received" && <Payments />}

           

               {page === "Expenses" && <Expenses />}

               

               {page === "Reports" && <Reports />}
               {page === "Add Employee" && <Employees />}
               {page === "All Employees" && <AllEmployees />}     
                </div>
      </div>
    </div>
  );
};

export default MainLayout;