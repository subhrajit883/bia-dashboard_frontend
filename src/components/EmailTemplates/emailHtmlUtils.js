/**
 * Email HTML & Spacing Preservation Utilities
 * 
 * Ensures that line breaks, blank lines, indentation (spaces/tabs),
 * and paragraph spacing are 100% preserved when rendered across all
 * email clients (Gmail, Outlook desktop/web, Apple Mail, Yahoo).
 */

// Check if string contains HTML tags (excluding dynamic tags like {{name}})
export const isHtmlContent = (str = "") => {
    if (!str) return false;
    // Look for HTML tags like <p>, <div>, <br>, <h2>, <strong>, etc.
    return /<[a-z][\s\S]*>/i.test(str);
};

/**
 * Converts plain text to email-safe HTML preserving:
 * - Line breaks (\n -> <br/>)
 * - Blank lines (\n\n -> <div style="min-height:18px; line-height:18px;">&nbsp;</div>)
 * - Indentation (tabs -> 4 non-breaking spaces, leading spaces -> &nbsp;)
 * - Multiple consecutive spaces -> &nbsp;
 */
export const plainTextToEmailHtml = (text = "") => {
    if (!text) return "";

    const lines = text.split(/\r?\n/);
    const formattedLines = lines.map((line) => {
        // If the line is empty or whitespace only, preserve as a distinct blank line
        if (line.trim().length === 0) {
            return '<div style="min-height: 18px; line-height: 18px;">&nbsp;</div>';
        }

        // Preserve tabs and leading indentation with non-breaking spaces
        let formattedLine = line
            .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
            .replace(/^(\s+)/, (match) => "&nbsp;".repeat(match.length))
            .replace(/ {2,}/g, (match) => "&nbsp;".repeat(match.length));

        return `<div style="margin: 0; min-height: 1.4em; line-height: 1.6;">${formattedLine}</div>`;
    });

    const innerHtml = formattedLines.join("");

    // Wrap in standard email container with cross-client safe typography & white-space styling
    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${innerHtml}</div>`;
};

/**
 * Cleans and normalizes HTML from visual or code editors so that
 * email clients do not collapse empty paragraphs, blank lines, or indents.
 */
export const normalizeEmailHtml = (html = "") => {
    if (!html) return "";

    let processed = html;

    // Convert empty paragraphs or div line breaks to explicit blank line spacers
    processed = processed
        .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<div style="min-height: 18px; line-height: 18px;">&nbsp;</div>')
        .replace(/<div>\s*<br\s*\/?>\s*<\/div>/gi, '<div style="min-height: 18px; line-height: 18px;">&nbsp;</div>')
        .replace(/<p>\s*(&nbsp;|\u00A0)\s*<\/p>/gi, '<div style="min-height: 18px; line-height: 18px;">&nbsp;</div>')
        .replace(/<p>\s*<\/p>/gi, '<div style="min-height: 18px; line-height: 18px;">&nbsp;</div>');

    // Ensure container wrapper with white-space: pre-wrap exists if not already present
    if (!processed.includes("white-space: pre-wrap") && !processed.includes("white-space:pre-wrap")) {
        processed = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${processed}</div>`;
    }

    return processed;
};

/**
 * Universal function to ensure spacing is preserved whether input is plain text or HTML
 */
export const preserveEmailSpacing = (input = "") => {
    if (!input) return "";
    if (isHtmlContent(input)) {
        return normalizeEmailHtml(input);
    }
    return plainTextToEmailHtml(input);
};

/**
 * Converts HTML to readable text while preserving line breaks, blank lines, and indentations
 */
export const emailHtmlToPlainText = (html = "") => {
    if (!html) return "";

    let text = html;

    // Replace common line break tags with newlines
    text = text
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/h[1-6]>/gi, "\n\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<li[^>]*>/gi, "• ");

    // Replace non-breaking spaces with standard space
    text = text.replace(/&nbsp;|\u00A0/gi, " ");

    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, "");

    // Decode HTML entities
    text = text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Clean up excessive blank lines (more than 2 in a row)
    text = text.replace(/\n{3,}/g, "\n\n");

    return text.trim();
};
