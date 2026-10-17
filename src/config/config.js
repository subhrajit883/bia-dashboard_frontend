export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5173";

export const authUrl = {
  login: `${BASE_URL}/api/auth/login`,
  register: `${BASE_URL}/api/auth/register-counsellor`,
  changePassword: `${BASE_URL}/api/auth/changePassword`
};

export const adminUrl = {
  sources: `${BASE_URL}/api/sources`,
  courses: `${BASE_URL}/api/courses`,
  counsellors: `${BASE_URL}/api/counsellors/all`,
  counsellorStatus: (counsellorId) => `${BASE_URL}/api/admin/counsellors/${counsellorId}/status`,
  students: `${BASE_URL}/api/students`,
};

export const counsellorUrl = {
  counsellorAll: `${BASE_URL}/api/counsellors/all`,
  statusUpdate: (counsellorId) => `${BASE_URL}/api/admin/counsellors/${counsellorId}/status`,
};

export const courseUrl = {
  courses: `${BASE_URL}/api/courses`,
};

export const sourcesUrl = {
  sources: `${BASE_URL}/api/sources`,
};

export const leadUrl = {
  lead: `${BASE_URL}/api/leads`,
  leadById: (id) => `${BASE_URL}/api/leads/${id}`,
  updateLead: (id) => `${BASE_URL}/api/leads/${id}`,
};

export const studentUrl = {
  students: `${BASE_URL}/api/students`,
};

export const counsellorPerformanceUrl = {
  performance: `${BASE_URL}/api/counsellors/performance`,
  report: `${BASE_URL}/api/reports/counsellor-performance`
};