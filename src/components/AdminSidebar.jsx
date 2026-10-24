
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    FiUsers,
    FiGrid,
    FiUserCheck,
    FiMessageCircle,
    FiSettings,
    FiLogOut,
    FiChevronRight,
    FiChevronLeft,
    FiBookOpen,
} from "react-icons/fi";

import logo from "../assets/bia.png";
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaHeart, FaInstagram, FaUserPlus } from "react-icons/fa";
import { User, UserPlus, UserRoundGroup, BarChart3, Mail, Send } from "lucide-react";
import { PiStudentBold } from "react-icons/pi";
import { BiCategory } from "react-icons/bi";

const NAV_ITEMS = [
    // { label: "Dashboard", icon: FiLayout, to: "/admin/dashboard" },
    { label: "Add Leads", icon: UserPlus, to: "/admin/addlead" },
    { label: "All Leads", icon: UserRoundGroup, to: "/admin/leads" },
    { label: "Add Student", icon: FaUserPlus, to: "/admin/addstudent" },
    { label: "All Students", icon: PiStudentBold, to: "/admin/students" },
    { label: "Counsellor", icon: User, to: "/admin/counsellors" },
    { label: "Performance", icon: BarChart3, to: "/admin/counsellors-performance" },
    { label: "Sources", icon: FaInstagram, to: "/admin/sources" },
    { label: "Courses", icon: BiCategory, to: "/admin/courses" },
    { label: "Email Template", icon: Mail, to: "/admin/emailtemplate" },
    { label: "Send Emails", icon: Send, to: "/admin/sendemail" },
    // { label: "Settings", icon: FiSettings, to: "/admin/settings" },
];

const AdminSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const AdminLogout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRole");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
    };
    return (
        <>
            {isOpen && (
                <div
                    onClick={closeSidebar}
                    className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] md:hidden print:hidden"
                />
            )}

            <aside
                className={`
                    fixed md:sticky
                    top-0 left-0
                    z-50
                    flex flex-col
                    w-64
                    h-screen
                    min-h-screen
                    bg-[#0B1437]
                    text-slate-200
                    shrink-0
                    shadow-2xl md:shadow-none
                    print:hidden

                    transform
                    transition-transform
                    duration-300
                    ease-in-out

                    ${isOpen
                        ? "translate-x-0"
                        : "-translate-x-full md:translate-x-0"
                    }
                `}
            >
                <div className="px-6 pt-7 pb-8">
                    <NavLink
                        to="/"
                        onClick={closeSidebar}
                        className="flex items-center justify-center"
                    >
                        <img
                            src={logo}
                            alt="logo"

                            className="max-w-42.5 max-h-16 object-contain"
                        />
                    </NavLink>
                </div>
               
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.label}
                                to={item.to}
                                onClick={closeSidebar}
                                className={({ isActive }) =>
                                    `
                                    flex items-center gap-3
                                    px-4 py-3
                                    rounded-xl
                                    text-sm font-medium
                                    transition-all duration-200
                                    ${isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                                    }
                                    `
                                }
                            >
                                <Icon
                                    size={19}
                                    className="shrink-0"
                                />

                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="px-4 py-4 mt-auto">
                    <div className="h-px bg-white/10 mb-4" />

                    <button
                        type="button"
                        className="
                            flex items-center gap-3
                            w-full
                            px-4 py-3
                            rounded-xl
                            text-sm font-medium
                            text-slate-300
                            hover:bg-white/5
                            hover:text-white
                            transition-all duration-200
                            cursor-pointer
                        "
                        onClick={AdminLogout}
                    >
                        <FiLogOut
                            size={19}
                            className="shrink-0"
                        />

                        <span>Logout</span>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    aria-label={
                        isOpen
                            ? "Close sidebar"
                            : "Open sidebar"
                    }
                    className="
                        md:hidden
                        absolute
                        top-1/2
                        -right-10
                        -translate-y-1/2

                        w-10
                        h-16

                        flex
                        items-center
                        justify-center

                        bg-[#0B1437]
                        text-white

                        rounded-r-2xl
                        shadow-xl

                        border-l
                        border-white/10

                        hover:bg-[#101c49]

                        transition-all
                        duration-200
                    "
                >
                    {isOpen ? (
                        <FiChevronLeft size={21} />
                    ) : (
                        <FiChevronRight size={21} />
                    )}
                </button>
            </aside>
        </>
    );
};

export default AdminSidebar;
