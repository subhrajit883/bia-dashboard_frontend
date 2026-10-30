import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import HomePage from "../pages/HomePage";
import MainLayout from "../layout/MainLayout";

import CounsellorLogin from "../pages/CounsellorPages/CounsellorLogin";
import NotFound from "../pages/NotFound";
import CounsellorRegister from "../pages/CounsellorPages/CounsellorRegister";
import CounsellorLayout from "../layout/CounsellorLayout";
import CounsellorProtectedRoute from "./CounsellorProtectedRoute";
import CounsellorDashboard from "../pages/CounsellorPages/CounsellorDashboard";
import AdminLayout from "../layout/AdminLayout";
import AdminLogin from "../pages/AdminPages/AdminLogin";
import AdminDashboard from "../pages/AdminPages/AdminDashboard";
import AdminSources from "../pages/AdminPages/AdminSources";
import AdminCourses from "../pages/AdminPages/AdminCourses";
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminAddStudent from "../pages/AdminPages/AdminAddStudent";
import AdminEditStudent from "../pages/AdminPages/AdminEditStudent";
import AdminAddLead from "../pages/AdminPages/AdminAddLead";
import AdminEditLead from "../pages/AdminPages/AdminEditLead";
import AdminLeads from "../pages/AdminPages/AdminLeads";
import AdminLeadDetails from "../pages/AdminPages/AdminLeadDetails";
import AdminLeadFollowUp from "../pages/AdminPages/AdminLeadFollowUp";
import AdminStudents from "../pages/AdminPages/AdminStudents";
import AdminCounsellor from "../pages/AdminPages/AdminCounsellor";
import AdminCounsellorPerformance from "../pages/AdminPages/AdminCounsellorPerformance";
import CounsellorAddLead from "../pages/CounsellorPages/CounsellorAddLead";
import CounsellorLeads from "../pages/CounsellorPages/CounsellorLeads";
import CounsellorLeadDetails from "../pages/CounsellorPages/CounsellorLeadDetails";
import CounsellorLeadFollowUp from "../pages/CounsellorPages/CounsellorLeadFollowUp";
import CounsellorEditLead from "../pages/CounsellorPages/CounsellorEditLead";
import CounsellorAddStudent from "../pages/CounsellorPages/CounsellorAddStudent";
import CounsellorStudent from "../pages/CounsellorPages/CounsellorStudent";
import CounsellorEditStudent from "../pages/CounsellorPages/CounsellorEditStudent";
import CounsellorEmail from "../pages/CounsellorPages/CounsellorEmail";
import CounsellorSendEmail from "../pages/CounsellorPages/CounsellorSendEmail";
import AdminSendEmail from "../pages/AdminPages/AdminSendEmail";
import AdminEmail from "../pages/AdminPages/AdminEmail";
import CounsellorProfile from "../pages/CounsellorPages/CounsellorProfile";
import CounsellorForgotPassword from "../pages/CounsellorPages/CounsellorForgotPassword";
import CounsellorResetPassword from "../pages/CounsellorPages/CounsellorResetPassword";
import AdminSettings from "../pages/AdminPages/AdminSettings";

const AppRoute = () => {
    return (
        <BrowserRouter>

            <Routes>
                {/* Main Website Layout */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />

                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Admin Routes */}

                <Route path="/admin/login" element={<AdminLogin />} />

                <Route
                    element={
                        <AdminProtectedRoute>
                            <AdminLayout />
                        </AdminProtectedRoute>
                    }
                >
                    <Route
                        path="/admin"
                        element={<Navigate to="/admin/leads" replace />}
                    />

                    <Route path="/admin/sources" element={<AdminSources />} />
                    <Route path="/admin/courses" element={<AdminCourses />} />
                    <Route path="/admin/addstudent" element={<AdminAddStudent />} />
                    <Route path="/admin/editstudent/:id" element={<AdminEditStudent />} />
                    <Route path="/admin/students/edit/:id" element={<AdminEditStudent />} />
                    <Route path="/admin/students" element={<AdminStudents />} />
                    <Route path="/admin/addlead" element={<AdminAddLead />} />
                    <Route path="/admin/editlead/:id" element={<AdminEditLead />} />
                    <Route path="/admin/leads/edit/:id" element={<AdminEditLead />} />
                    <Route path="/admin/leads" element={<AdminLeads />} />
                    {/* <Route path="/admin/emails" element={<AdminEmails />} /> */}
                    <Route path="/admin/leads/:id" element={<AdminLeadDetails />} />
                    <Route path="/admin/leads/:id/follow-ups" element={<AdminLeadFollowUp />} />
                    <Route path="/admin/leads/follow-up/:id" element={<AdminLeadFollowUp />} />
                    <Route path="/admin/lead-follow-up/:id" element={<AdminLeadFollowUp />} />
                    <Route path="/admin/counsellors" element={<AdminCounsellor />} />
                    <Route path="/admin/counsellors-performance" element={<AdminCounsellorPerformance />} />
                    <Route path="/admin/emailtemplate" element={<AdminEmail />} />
                    <Route path="/admin/sendemail" element={<AdminSendEmail />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>

                <Route
                    path="/counsellor/register"
                    element={<CounsellorRegister />}
                />

                <Route
                    path="/counsellor/login"
                    element={<CounsellorLogin />}
                />

                <Route
                    path="/counsellor/forgot-password"
                    element={<CounsellorForgotPassword />}
                />
                <Route
                    path="/forgot-password"
                    element={<CounsellorForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<CounsellorResetPassword />}
                />
                <Route
                    path="/counsellor/reset-password"
                    element={<CounsellorResetPassword />}
                />

                <Route
                    element={
                        <CounsellorProtectedRoute>
                            <CounsellorLayout />
                        </CounsellorProtectedRoute>
                    }
                >
                    <Route
                        path="/counsellor"
                        element={<Navigate to="/counsellor/leads" replace />}
                    />
                    {/* <Route path="/counsellor/dashboard" element={<CounsellorDashboard />} /> */}
                    <Route path="/counsellor/addlead" element={<CounsellorAddLead />} />
                    <Route path="/counsellor/editlead/:id" element={<CounsellorEditLead />} />
                    <Route path="/counsellor/leads/edit/:id" element={<CounsellorEditLead />} />
                    <Route path="/counsellor/leads" element={<CounsellorLeads />} />
                    <Route path="/counsellor/leads/:id" element={<CounsellorLeadDetails />} />
                    <Route path="/counsellor/leads/:id/follow-ups" element={<CounsellorLeadFollowUp />} />
                    <Route path="/counsellor/leads/follow-up/:id" element={<CounsellorLeadFollowUp />} />
                    <Route path="/counsellor/lead-follow-up/:id" element={<CounsellorLeadFollowUp />} />
                    <Route path="/counsellor/addstudent" element={<CounsellorAddStudent />} />
                    <Route path="/counsellor/editstudent/:id" element={<CounsellorEditStudent />} />
                    <Route path="/counsellor/students/edit/:id" element={<CounsellorEditStudent />} />
                    <Route path="/counsellor/students" element={<CounsellorStudent />} />
                    <Route path="/counsellor/emailtemplate" element={<CounsellorEmail />} />
                    <Route path="/counsellor/emails" element={<CounsellorSendEmail />} />
                    <Route path="/counsellor/profile" element={<CounsellorProfile />} />
                    <Route path="/counsellor/profile/:id" element={<CounsellorProfile />} />
                </Route>

            </Routes>

        </BrowserRouter>
    );
};

export default AppRoute;