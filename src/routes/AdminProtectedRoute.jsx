import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }) => {
  return localStorage.getItem("adminToken") &&
    localStorage.getItem("adminRole") === "admin" ? (
    children
  ) : (
    <Navigate to="/admin/login" replace />
  );
};

export default AdminProtectedRoute;
