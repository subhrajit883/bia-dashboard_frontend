import { Navigate } from "react-router-dom";

const AccountProtectedRoute = ({ children }) => {

    const token = localStorage.getItem("accountToken");

    return token ? children : <Navigate to="/accountlogin" replace />;
};

export default AccountProtectedRoute;
