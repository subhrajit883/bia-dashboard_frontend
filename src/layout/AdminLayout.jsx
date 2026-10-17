import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

const AdminLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 min-h-screen overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
