import { Outlet } from "react-router-dom";


const MainLayout = () => {
    
    return (
        <div className="flex flex-col min-h-screen">
        
            <main className="flex-grow">
                <Outlet />
            </main>

        </div>
    );
};

export default MainLayout;