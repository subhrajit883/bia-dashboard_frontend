// Preset Quick Templates for fast counsellor drafting
export const QUICK_TEMPLATES = [
    {
        title: "Academy Announcement & Updates",
        subject: "Important Academic Update: {{course}}",
        body: "<h2>Hello {{name}},</h2><p>We are delighted to share key updates and workshop announcements regarding <strong>{{course}}</strong>.</p><p>For any queries or scheduling details, feel free to contact counsellor <strong>{{counsellorName}}</strong> at <strong>{{phone}}</strong>.</p><p>Best regards,<br/>Academic Counseling Team</p>",
        targetType: "all",
        isDraft: false,
    },
    {
        title: "Course Follow-up",
        subject: "Information about {{course}}",
        body: "<h2>Hello {{name}},</h2><p>Thank you for your interest in <strong>{{course}}</strong>.</p><p>Our counsellor <strong>{{counsellorName}}</strong> will be happy to assist you in planning your learning roadmap.</p><p>Contact: <strong>{{phone}}</strong></p><p>Best regards,<br/>Admissions & Counseling Team</p>",
        targetType: "lead",
        isDraft: false,
    },
    {
        title: "Welcome & Admission Confirmation",
        subject: "Welcome to {{course}} - Admission Confirmed!",
        body: "<h2>Congratulations {{name}}!</h2><p>We are delighted to confirm your admission for <strong>{{course}}</strong>.</p><p>Your dedicated counsellor is <strong>{{counsellorName}}</strong>. You can reach out directly at <strong>{{phone}}</strong> for any batch schedule updates.</p><p>Get ready for an exciting learning journey!</p>",
        targetType: "student",
        isDraft: false,
    },
];

// Available dynamic placeholder tags for templates
export const DYNAMIC_VARIABLES = [
    { tag: "{{name}}", label: "Student / Lead Name", description: "Recipient's full name" },
    { tag: "{{course}}", label: "Course Name", description: "Enrolled or interested course" },
    { tag: "{{counsellorName}}", label: "Counsellor Name", description: "Assigned counsellor's name" },
    { tag: "{{counsellorPhone}}", label: "Counsellor Phone", description: "Assigned counsellor's phone" },
    { tag: "{{counsellorEmail}}", label: "Counsellor Email", description: "Assigned counsellor's email" },
    // { tag: "{{phone}}", label: "Phone Number", description: "Counsellor / Helpline phone" },
    // { tag: "{{email}}", label: "Email Address", description: "Recipient's email address" },
    // { tag: "{{admissionDate}}", label: "Admission Date", description: "Formatted admission date" },
    // { tag: "{{fees}}", label: "Total Fees", description: "Total course fee amount" },
];

// Target audience configuration matching enum: ["lead", "student", "all"]
export const TARGET_TYPES = [
    { value: "all", label: "All Audiences", color: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20" },
    { value: "lead", label: "Lead", color: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20" },
    { value: "student", label: "Student", color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20" },
];

// Substitute dynamic tags with realistic sample data for previewing
export const renderWithSampleData = (text) => {
    if (!text) return "";
    return text
        .replace(/\{\{\s*name\s*\}\}/gi, "Subhrajit Mukherjee")
        .replace(/\{\{\s*course\s*\}\}/gi, "Film Acting")
        .replace(/\{\{\s*counsellorName\s*\}\}/gi, "Mr. Suman Kar")
        .replace(/\{\{\s*counsellorPhone\s*\}\}/gi, "+91 94326 34781")
        .replace(/\{\{\s*counsellorEmail\s*\}\}/gi, "counsellor@biacademy.com")
        .replace(/\{\{\s*phone\s*\}\}/gi, "+91 94326 34781")
        .replace(/\{\{\s*email\s*\}\}/gi, "subhrajit@example.com")
        .replace(/\{\{\s*admissionDate\s*\}\}/gi, "24 Oct 2026")
        .replace(/\{\{\s*date\s*\}\}/gi, "24 Oct 2026")
        .replace(/\{\{\s*fees\s*\}\}/gi, "₹45,000");
};

// Extract dynamic tags from template string
export const extractTags = (text = "") => {
    const matches = text.match(/\{\{[a-zA-Z0-9_-]+\}\}/g);
    return matches ? [...new Set(matches)] : [];
};

// Strip HTML tags for card snippet view
export const stripHtml = (html = "") => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

// Format ISO date string into readable format
export const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
        const d = new Date(isoString);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(isoString);
    }
};
