import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

const CounsellorProtectedRoute = ({ children }) => {
    return isAuthenticated()
        ? children
        : <Navigate to="/counsellor/login" replace />;
};

export default CounsellorProtectedRoute;