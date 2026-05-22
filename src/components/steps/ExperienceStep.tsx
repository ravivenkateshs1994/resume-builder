"use client";

import { useResumeStore } from "@/store/resumeStore";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import type { WorkExperience } from "@/types/resume";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Minus,
  Sparkles as _Sparkles,
} from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1969 }, (_, i) => (THIS_YEAR - i).toString());

function MonthYearSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const parts = value?.split(" ") ?? [];
  const month = MONTHS.includes(parts[0]) ? parts[0] : "";
  const year = parts[1] ?? (YEARS.includes(parts[0]) ? parts[0] : "");

  function update(m: string, y: string) {
    if (m && y) onChange(`${m} ${y}`);
    else if (m) onChange(m);
    else if (y) onChange(y);
    else onChange("");
  }

  const selectClass =
    "flex-1 border border-gray-300 rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="flex gap-2">
      <select value={month} onChange={(e) => update(e.target.value, year)} disabled={disabled} className={selectClass}>
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={YEARS.includes(year) ? year : ""} onChange={(e) => update(month, e.target.value)} disabled={disabled} className={selectClass}>
        <option value="">Year</option>
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ── Premium rich text editor ──────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: (e: MouseEvent) => void;
  active?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(e); }}
      className={`p-1.5 rounded-md transition-all duration-100 ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />;
}

function DescriptionEditor({
  value,
  onChange,
  onOptimize,
  isOptimizing,
}: {
  value: string;
  onChange: (html: string) => void;
  onOptimize: (payload: { htmlContent: string; selectedText?: string }) => Promise<{ resultHtml?: string; resultText?: string; resultLines?: string[] } | null>;
  isOptimizing: boolean;
}) {
  const [hasSelection, setHasSelection] = useState(false);

  function selectedTextFromEditor(editorRef: NonNullable<typeof editor>) {
    const { from, to, empty } = editorRef.state.selection;
    if (empty) return "";
    return editorRef.state.doc.textBetween(from, to, "\n").trim();
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Describe your responsibilities and achievements...",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      setHasSelection(selectedTextFromEditor(editor).length > 0);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const charCount = editor?.storage.characterCount?.characters?.() ?? editor?.getText().length ?? 0;

  async function handleOptimizeClick() {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const selectedText = selectedTextFromEditor(editor);
    const result = await onOptimize({
      htmlContent: editor.getHTML(),
      selectedText: selectedText || undefined,
    });

    if (!result) return;

    if (selectedText && Array.isArray(result.resultLines) && result.resultLines.length > 0) {
      const inBulletList = editor.isActive("bulletList");
      const inOrderedList = editor.isActive("orderedList");
      if (inBulletList || inOrderedList) {
        const tag = inOrderedList ? "ol" : "ul";
        const listHtml = `<${tag}>${result.resultLines
          .map((line) => `<li><p>${line}</p></li>`)
          .join("")}</${tag}>`;
        editor.chain().focus().insertContentAt({ from, to }, listHtml).run();
      } else {
        editor.chain().focus().insertContentAt({ from, to }, result.resultLines.join("\n")).run();
      }
      onChange(editor.getHTML());
      return;
    }

    if (selectedText && result.resultText) {
      editor.chain().focus().insertContentAt({ from, to }, result.resultText).run();
      onChange(editor.getHTML());
      return;
    }

    if (result.resultHtml) {
      // Replace content via editor transaction so history (undo/redo) remains intact.
      editor.chain().focus().selectAll().insertContent(result.resultHtml).run();
      onChange(editor.getHTML());
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:shadow-md focus-within:border-blue-400 transition-all duration-200 bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2.5 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {/* Text formatting */}
        <ToolbarBtn title="Bold (Ctrl+B)" active={!!editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Italic (Ctrl+I)" active={!!editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Underline (Ctrl+U)" active={!!editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" active={!!editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </ToolbarBtn>

        <Divider />

        {/* Lists */}
        <ToolbarBtn title="Bullet list" active={!!editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Numbered list" active={!!editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolbarBtn>

        <Divider />

        {/* Divider line */}
        <ToolbarBtn title="Horizontal rule" active={false} onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
          <Minus size={14} />
        </ToolbarBtn>

        <Divider />

        {/* History */}
        <ToolbarBtn title="Undo (Ctrl+Z)" active={false} onClick={() => editor?.chain().focus().undo().run()}>
          <Undo2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn title="Redo (Ctrl+Y)" active={false} onClick={() => editor?.chain().focus().redo().run()}>
          <Redo2 size={14} />
        </ToolbarBtn>

        {/* Character count — right aligned */}
        <div className="ml-auto text-[10px] text-gray-400 font-mono tabular-nums pr-1">
          {charCount} chars
        </div>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="tiptap-editor px-4 py-3 text-sm min-h-[140px] text-gray-800"
      />

      <div className="px-3 pb-3 pt-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleOptimizeClick}
          disabled={isOptimizing || !editor?.getText().trim()}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-1.5 rounded-lg transition-colors"
        >
          {isOptimizing ? (
            <><span className="animate-spin">⟳</span> Optimizing...</>
          ) : (
            <>✨ {hasSelection ? "Optimize Selection" : "Optimize Content"}</>
          )}
        </button>
        <span className="text-[11px] text-gray-500">
          {hasSelection ? "Selected text will be optimized only." : "Tip: select a line to optimize only that part."}
        </span>
      </div>
    </div>
  );
}

export default function ExperienceStep() {
  const {
    resumeData,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    nextStep,
    prevStep,
    setIsGenerating,
  } = useResumeStore();

  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  async function optimizeDescription(
    w: WorkExperience,
    payload: { htmlContent: string; selectedText?: string }
  ): Promise<{ resultHtml?: string; resultText?: string; resultLines?: string[] } | null> {
    if (!payload.htmlContent || payload.htmlContent === "<p></p>") return null;
    setOptimizingId(w.id);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "optimize",
          resumeData,
          htmlContent: payload.htmlContent,
          selectedText: payload.selectedText,
          jobTitle: w.title,
        }),
      });
      const data = await res.json();

      if (payload.selectedText) {
        return {
          resultText: typeof data.resultText === "string" ? data.resultText : "",
          resultLines: Array.isArray(data.resultLines) ? data.resultLines : undefined,
        };
      }

      if (typeof data.resultHtml === "string") {
        return { resultHtml: data.resultHtml };
      }

      if (typeof data.result === "string") {
        return { resultHtml: data.result };
      }
      return null;
    } catch {
      return null;
    } finally {
      setOptimizingId(null);
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">Work Experience</h2>
      <p className="text-sm text-gray-500 mb-6">Add your roles. You can optimize the full description or just a selected line.</p>

      <div className="space-y-6">
        {resumeData.workExperience.map((w, idx) => {
          const isCurrent = w.endDate === "Present";
          return (
            <div key={w.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position {idx + 1}</span>
                <button onClick={() => removeWorkExperience(w.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Remove</button>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Job Title <span className="text-red-500">*</span></label>
                    <input value={w.title} onChange={(e) => updateWorkExperience(w.id, { title: e.target.value })} placeholder="e.g. Senior Software Engineer" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Company <span className="text-red-500">*</span></label>
                    <input value={w.company} onChange={(e) => updateWorkExperience(w.id, { company: e.target.value })} placeholder="e.g. Acme Corp" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Location</label>
                  <input value={w.location || ""} onChange={(e) => updateWorkExperience(w.id, { location: e.target.value })} placeholder="e.g. New York, NY (or Remote)" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Start Date</label>
                    <MonthYearSelect value={w.startDate} onChange={(v) => updateWorkExperience(w.id, { startDate: v })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">End Date</label>
                    <MonthYearSelect value={isCurrent ? "" : w.endDate} onChange={(v) => updateWorkExperience(w.id, { endDate: v })} disabled={isCurrent} />
                    <label className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none">
                      <input type="checkbox" checked={isCurrent} onChange={(e) => updateWorkExperience(w.id, { endDate: e.target.checked ? "Present" : "" })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-gray-600">Currently working here</span>
                    </label>
                  </div>
                </div>

                {/* Description — rich text editor */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Description</label>
                  <DescriptionEditor
                    value={w.description}
                    onChange={(html) => updateWorkExperience(w.id, { description: html })}
                    onOptimize={(payload) => optimizeDescription(w, payload)}
                    isOptimizing={optimizingId === w.id}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addWorkExperience}
        className="mt-4 w-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 rounded-xl py-3 text-sm font-medium transition-colors"
      >
        + Add Position
      </button>

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          className="border border-gray-300 text-gray-600 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          Next: Education →
        </button>
      </div>
    </div>
  );
}
