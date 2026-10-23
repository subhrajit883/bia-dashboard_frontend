import { useState, useRef, useEffect, useCallback } from "react";
import {
    Bold, Italic, Underline, Strikethrough,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Indent, Outdent, Link, Minus, Sparkles, Code2,
    Eye, Edit3, Type, RotateCcw, RotateCw, Check, Copy
} from "lucide-react";
import toast from "react-hot-toast";
import {
    preserveEmailSpacing,
    plainTextToEmailHtml,
    emailHtmlToPlainText,
    isHtmlContent
} from "./emailHtmlUtils";

function EmailRichTextEditor({
    value = "",
    onChange,
    dynamicVariables = [],
    sampleDataReplacer = (text) => text,
    placeholder = "Type your email template here... Use Enter for line breaks, blank lines for paragraph separation, and Tab or spaces for indentation.",
}) {
    // Current active mode: "visual" | "plain" | "code" | "preview"
    const [activeTab, setActiveTab] = useState("visual");
    const [plainText, setPlainText] = useState("");
    const [selectedColor, setSelectedColor] = useState("#1e293b");
    const [copiedHtml, setCopiedHtml] = useState(false);

    const visualEditorRef = useRef(null);
    const plainTextareaRef = useRef(null);
    const codeTextareaRef = useRef(null);

    // Sync external value to visual editor & plain text
    useEffect(() => {
        const safeHtml = value || "";
        if (visualEditorRef.current && visualEditorRef.current.innerHTML !== safeHtml) {
            visualEditorRef.current.innerHTML = safeHtml;
        }
        setPlainText(emailHtmlToPlainText(safeHtml));
    }, [value]);

    // Handle change from Visual Editor
    const handleVisualInput = useCallback(() => {
        if (!visualEditorRef.current) return;
        const currentHtml = visualEditorRef.current.innerHTML;
        const normalized = preserveEmailSpacing(currentHtml);
        onChange(normalized);
        setPlainText(emailHtmlToPlainText(normalized));
    }, [onChange]);

    // Handle change from Plain Text mode (with auto HTML conversion)
    const handlePlainTextInput = (e) => {
        const newText = e.target.value;
        setPlainText(newText);
        const convertedHtml = plainTextToEmailHtml(newText);
        onChange(convertedHtml);
        if (visualEditorRef.current) {
            visualEditorRef.current.innerHTML = convertedHtml;
        }
    };

    // Handle change from HTML Code mode
    const handleCodeInput = (e) => {
        const newCode = e.target.value;
        const normalized = preserveEmailSpacing(newCode);
        onChange(normalized);
        if (visualEditorRef.current) {
            visualEditorRef.current.innerHTML = normalized;
        }
        setPlainText(emailHtmlToPlainText(normalized));
    };

    // Execute rich text formatting command
    const executeCommand = (command, commandValue = null) => {
        if (activeTab !== "visual") {
            setActiveTab("visual");
        }
        if (visualEditorRef.current) {
            visualEditorRef.current.focus();
        }
        try {
            document.execCommand(command, false, commandValue);
            handleVisualInput();
        } catch {
            // fallback
        }
    };

    // Handle Tab key in visual editor for precise indentation
    const handleVisualKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            if (e.shiftKey) {
                executeCommand("outdent");
            } else {
                // Insert 4 non-breaking spaces to preserve exact indentation in email
                executeCommand("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
            }
        }
    };

    // Handle Tab key in plain text editor for indentation
    const handlePlainKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const textarea = plainTextareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const spaces = "    "; // 4 spaces

            const nextText = plainText.substring(0, start) + spaces + plainText.substring(end);
            setPlainText(nextText);
            const convertedHtml = plainTextToEmailHtml(nextText);
            onChange(convertedHtml);

            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
            }, 0);
        }
    };

    // Insert dynamic tag at cursor position
    const insertTag = (tag) => {
        if (activeTab === "visual") {
            if (visualEditorRef.current) {
                visualEditorRef.current.focus();
                executeCommand("insertHTML", `<strong>${tag}</strong> `);
            }
        } else if (activeTab === "plain") {
            const textarea = plainTextareaRef.current;
            if (!textarea) {
                setPlainText((prev) => prev + " " + tag);
                onChange(plainTextToEmailHtml(plainText + " " + tag));
                return;
            }
            const start = textarea.selectionStart || 0;
            const end = textarea.selectionEnd || 0;
            const nextText = plainText.substring(0, start) + tag + " " + plainText.substring(end);
            setPlainText(nextText);
            onChange(plainTextToEmailHtml(nextText));

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
            }, 50);
        } else if (activeTab === "code") {
            const textarea = codeTextareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart || 0;
            const end = textarea.selectionEnd || 0;
            const nextCode = value.substring(0, start) + tag + value.substring(end);
            onChange(nextCode);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + tag.length, start + tag.length);
            }, 50);
        }
    };

    // Add hyperlink
    const handleAddLink = () => {
        const url = prompt("Enter hyperlink URL (e.g. https://biacademy.in):", "https://");
        if (url && url !== "https://") {
            executeCommand("createLink", url);
        }
    };

    // Add Call To Action button
    const handleInsertCtaButton = () => {
        const text = prompt("Enter button label:", "Explore Course Details");
        if (!text) return;
        const link = prompt("Enter button link URL:", "https://biacademy.in");
        if (!link) return;

        const buttonHtml = `<div style="margin: 18px 0;"><a href="${link}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${text} &rarr;</a></div><div style="min-height: 18px;">&nbsp;</div>`;
        executeCommand("insertHTML", buttonHtml);
    };

    // Copy raw HTML
    const handleCopyHtml = () => {
        navigator.clipboard.writeText(value);
        setCopiedHtml(true);
        toast.success("HTML copied to clipboard!");
        setTimeout(() => setCopiedHtml(false), 2000);
    };

    // Format block (heading or paragraph)
    const handleFormatBlock = (tag) => {
        executeCommand("formatBlock", tag);
    };

    // Color options
    const colorOptions = [
        { label: "Dark Slate", color: "#1e293b" },
        { label: "Emerald Green", color: "#059669" },
        { label: "Ocean Blue", color: "#2563eb" },
        { label: "Royal Indigo", color: "#4f46e5" },
        { label: "Crimson Rose", color: "#e11d48" },
    ];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
            {/* Top Bar: Tabs & Dynamic Variables */}
            <div className="border-b border-slate-100 bg-slate-50/70 p-3 space-y-2.5">
                {/* Header Row: Tabs & Copy Action */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab("visual")}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === "visual"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            Visual Editor
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("plain")}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === "plain"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Type className="h-3.5 w-3.5" />
                            Plain Text (Auto-HTML)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("code")}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === "code"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Code2 className="h-3.5 w-3.5" />
                            HTML Source
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("preview")}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeTab === "preview"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Live Preview
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyHtml}
                            title="Copy HTML to clipboard"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        >
                            {copiedHtml ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            <span>{copiedHtml ? "Copied" : "Copy HTML"}</span>
                        </button>
                    </div>
                </div>

                {/* Dynamic Variables Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1 mr-1">
                        <Sparkles className="h-3 w-3 text-emerald-600" />
                        Placeholders:
                    </span>
                    {dynamicVariables.map((v) => (
                        <button
                            key={v.tag}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertTag(v.tag)}
                            title={`${v.label || v.tag} - Insert at cursor`}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-800 shadow-2xs transition hover:bg-emerald-600 hover:text-white"
                        >
                            <span>+ {v.tag}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Rich Formatting Toolbar (Active in Visual Mode) */}
            {activeTab === "visual" && (
                <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-white p-2 text-xs">
                    {/* Headings */}
                    <select
                        onChange={(e) => handleFormatBlock(e.target.value)}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-100"
                        defaultValue="<p>"
                    >
                        <option value="<p>">Normal Text</option>
                        <option value="<h1>">Heading 1 (Large)</option>
                        <option value="<h2>">Heading 2 (Medium)</option>
                        <option value="<h3>">Heading 3 (Small)</option>
                        <option value="<blockquote>">Quote Block</option>
                    </select>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Bold, Italic, Underline, Strikethrough */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("bold")}
                        title="Bold (Ctrl+B)"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Bold className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("italic")}
                        title="Italic (Ctrl+I)"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Italic className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("underline")}
                        title="Underline (Ctrl+U)"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Underline className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("strikeThrough")}
                        title="Strikethrough"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Strikethrough className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Color palette */}
                    <div className="flex items-center gap-1">
                        {colorOptions.map((c) => (
                            <button
                                key={c.color}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setSelectedColor(c.color);
                                    executeCommand("foreColor", c.color);
                                }}
                                title={c.label}
                                className="h-5 w-5 rounded-full border border-slate-300 transition hover:scale-110"
                                style={{ backgroundColor: c.color }}
                            />
                        ))}
                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Lists */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("insertUnorderedList")}
                        title="Bullet List"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("insertOrderedList")}
                        title="Numbered List"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <ListOrdered className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Alignment */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("justifyLeft")}
                        title="Align Left"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("justifyCenter")}
                        title="Align Center"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <AlignCenter className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("justifyRight")}
                        title="Align Right"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <AlignRight className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Indent / Outdent */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("outdent")}
                        title="Outdent (Shift+Tab)"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Outdent className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;")}
                        title="Indent / 4 Spaces (Tab)"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Indent className="h-4 w-4" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Hyperlink & CTA Button */}
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleAddLink}
                        title="Insert Link"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Link className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleInsertCtaButton}
                        title="Insert Call to Action Button"
                        className="cursor-pointer rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                        + CTA Button
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("insertHorizontalRule")}
                        title="Horizontal Line"
                        className="cursor-pointer rounded-lg p-1.5 text-slate-700 transition hover:bg-slate-100"
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => executeCommand("removeFormat")}
                        title="Clear Formatting"
                        className="cursor-pointer rounded-lg px-2 py-0.5 text-[10px] font-semibold text-slate-500 hover:bg-slate-100"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Editor Canvas Area */}
            <div className="relative min-h-[140px] bg-white">
                {/* Visual WYSIWYG Mode */}
                <div className={activeTab === "visual" ? "block" : "hidden"}>
                    <div
                        ref={visualEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleVisualInput}
                        onKeyDown={handleVisualKeyDown}
                        data-placeholder={placeholder}
                        className="min-h-[140px] max-h-[220px] overflow-y-auto p-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed outline-none focus:outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] [&_p]:mb-2.5 [&_h1]:mb-2.5 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-bold [&_ul]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_a]:text-emerald-600 [&_a]:underline"
                        style={{
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}
                    />
                </div>

                {/* Plain Text with Auto-HTML Conversion */}
                {activeTab === "plain" && (
                    <div className="p-2.5">
                        <div className="mb-2 rounded-xl bg-blue-50/70 border border-blue-100 p-2 text-[11px] text-blue-700 flex items-center justify-between">
                            <span>
                                ✍️ <strong>Auto-HTML Mode:</strong> Write naturally. Every line break, blank line, space, and Tab indentation is automatically preserved and converted into email-safe HTML.
                            </span>
                        </div>
                        <textarea
                            ref={plainTextareaRef}
                            rows={6}
                            value={plainText}
                            onChange={handlePlainTextInput}
                            onKeyDown={handlePlainKeyDown}
                            placeholder={placeholder}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 font-mono text-xs text-slate-800 outline-none leading-relaxed transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        />
                    </div>
                )}

                {/* Raw HTML Code Mode */}
                {activeTab === "code" && (
                    <div className="p-2.5">
                        <textarea
                            ref={codeTextareaRef}
                            rows={6}
                            value={value}
                            onChange={handleCodeInput}
                            placeholder="<div>Write custom HTML email code here...</div>"
                            className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-emerald-400 outline-none leading-relaxed transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-600"
                        />
                    </div>
                )}

                {/* Live Preview Mode */}
                {activeTab === "preview" && (
                    <div className="p-3 bg-slate-50/50 min-h-[140px] max-h-[220px] overflow-y-auto">
                        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Recipient Mailbox Preview
                                </span>
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-100">
                                    Dynamic Placeholders Replaced
                                </span>
                            </div>

                            {/* Rendered Body with Preserved Spacing */}
                            <div
                                className="text-sm text-slate-800 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: sampleDataReplacer(value) || "<p class='text-slate-400 italic'>No email body content entered yet...</p>",
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Info Footer */}
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Spacing Preservation Active (Line breaks, blank lines &amp; indentation preserved)
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span>
                        Chars: <strong>{value.length}</strong>
                    </span>
                    <span>
                        Words: <strong>{value.trim() ? emailHtmlToPlainText(value).split(/\s+/).filter(Boolean).length : 0}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default EmailRichTextEditor;
