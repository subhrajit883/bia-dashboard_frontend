import { Outlet } from "react-router-dom";
import CounsellorSidebar from "../components/CounsellorSidebar";

const CounsellorLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <CounsellorSidebar />
            <main className="flex-1 min-h-screen overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default CounsellorLayout;
