import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const auth = localStorage.getItem("vjc_invoice_auth");
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
