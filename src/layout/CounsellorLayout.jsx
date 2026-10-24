import { Outlet } from "react-router-dom";
import CounsellorSidebar from "../components/CounsellorSidebar";

const CounsellorLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50 print:block print:bg-white print:min-h-0">
            <CounsellorSidebar />
            <main className="flex-1 min-h-screen overflow-auto print:overflow-visible print:min-h-0 print:w-full print:p-0">
                <Outlet />
            </main>
        </div>
    );
};

export default CounsellorLayout;
