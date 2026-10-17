import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {

    const token = localStorage.getItem("token");

    return token ? children : <Navigate to="/adminlogin" replace />;
};

export default ProtectedRoute;