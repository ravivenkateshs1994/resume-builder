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
import { DOMSerializer } from "@tiptap/pm/model";
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
} from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1969 }, (_, i) => (THIS_YEAR - i).toString());

function MonthYearSelect({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  idPrefix?: string;
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
    "flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-2 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-slate-950 disabled:text-slate-500";

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <select id={idPrefix ? `${idPrefix}-month` : undefined} value={month} onChange={(e) => update(e.target.value, year)} disabled={disabled} className={selectClass}>
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select id={idPrefix ? `${idPrefix}-year` : undefined} value={YEARS.includes(year) ? year : ""} onChange={(e) => update(month, e.target.value)} disabled={disabled} className={selectClass}>
        <option value="">Year</option>
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// -- Premium rich text editor --------------------------------------------------
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
      className={`min-h-[44px] min-w-[44px] rounded-md p-2 transition-all duration-100 md:min-h-0 md:min-w-0 md:p-1.5 ${
        active
          ? "bg-cyan-500 text-slate-950 shadow-sm"
          : "text-slate-300 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px flex-shrink-0 bg-white/10" />;
}

function DescriptionEditor({
  id,
  value,
  onChange,
  onOptimize,
  isOptimizing,
}: {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  onOptimize: (payload: { htmlContent: string; selectedText?: string; selectedHtml?: string }) => Promise<{ resultHtml?: string; resultText?: string; resultLines?: string[] } | null>;
  isOptimizing: boolean;
}) {
  const [hasSelection, setHasSelection] = useState(false);

  function selectedTextFromEditor(editorRef: NonNullable<typeof editor>) {
    const { from, to, empty } = editorRef.state.selection;
    if (empty) return "";
    return editorRef.state.doc.textBetween(from, to, "\n").trim();
  }

  function selectedHtmlFromEditor(editorRef: NonNullable<typeof editor>) {
    const { from, to, empty } = editorRef.state.selection;
    if (empty) return "";

    const fragment = editorRef.state.doc.slice(from, to).content;
    const serializer = DOMSerializer.fromSchema(editorRef.schema);
    const wrapper = document.createElement("div");
    wrapper.appendChild(serializer.serializeFragment(fragment));
    return wrapper.innerHTML.trim();
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
    const selectedHtml = selectedHtmlFromEditor(editor);
    const result = await onOptimize({
      htmlContent: editor.getHTML(),
      selectedText: selectedText || undefined,
      selectedHtml: selectedHtml || undefined,
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
      // setContent is the reliable API for full content replacement in Tiptap.
      // selectAll().insertContent() can silently drop the insertion when the
      // selection spans block nodes, leaving the editor empty.
      editor.commands.setContent(result.resultHtml, { emitUpdate: false });
      onChange(editor.getHTML());
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 shadow-sm transition-all duration-200 focus-within:border-cyan-400/50 focus-within:shadow-[0_0_0_4px_rgba(103,232,249,0.12)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-slate-900/80 px-2.5 py-2">
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

        {/* Character count - right aligned */}
        <div className="ml-auto pr-1 font-mono text-[10px] tabular-nums text-slate-400">
          {charCount} chars
        </div>
      </div>

      {/* Editor area */}
      <EditorContent
        id={id}
        editor={editor}
        className="tiptap-editor min-h-[140px] px-4 py-3 text-sm text-slate-100"
      />

      <div className="flex flex-col items-start justify-between gap-2 px-3 pb-3 pt-1 md:flex-row md:items-center">
        <button
          type="button"
          onClick={handleOptimizeClick}
          disabled={isOptimizing || !editor?.getText().trim()}
          className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-100 transition-colors hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
        >
          {isOptimizing ? (
            <><span className="animate-spin inline-block">...</span> Optimizing...</>
          ) : (
            <>Optimize {hasSelection ? "Selection" : "Content"}</>
          )}
        </button>
        <span className="break-words text-[11px] text-slate-400">
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
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-[22px] font-bold text-slate-100 md:text-[30px]">Work Experience</h2>
        <p className="mb-0 break-words text-sm text-slate-300 md:text-base">Add your roles. You can optimize the full description or just a selected line.</p>
      </div>

      <div className="space-y-6">
        {resumeData.workExperience.map((w, idx) => {
          const isCurrent = w.endDate === "Present";
          return (
            <div key={w.id} className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/3">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-slate-950/40 px-4 py-3">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Position {idx + 1}</span>
                <button type="button" onClick={() => removeWorkExperience(w.id)} className="min-h-[44px] px-2 text-xs font-medium text-red-300 hover:text-red-200 md:min-h-0 md:px-0">Remove</button>
              </div>

              <div className="space-y-4 p-4 md:p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`job-title-${w.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Job Title <span className="text-red-400">*</span></label>
                    <input id={`job-title-${w.id}`} value={w.title} onChange={(e) => updateWorkExperience(w.id, { title: e.target.value })} placeholder="e.g. Senior Software Engineer" className="crp-input" />
                  </div>
                  <div>
                    <label htmlFor={`company-${w.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Company <span className="text-red-400">*</span></label>
                    <input id={`company-${w.id}`} value={w.company} onChange={(e) => updateWorkExperience(w.id, { company: e.target.value })} placeholder="e.g. Acme Corp" className="crp-input" />
                  </div>
                </div>

                <div>
                  <label htmlFor={`location-${w.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Location</label>
                  <input id={`location-${w.id}`} value={w.location || ""} onChange={(e) => updateWorkExperience(w.id, { location: e.target.value })} placeholder="e.g. New York, NY (or Remote)" className="crp-input" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor={`start-${w.id}-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Start Date</label>
                    <MonthYearSelect idPrefix={`start-${w.id}`} value={w.startDate} onChange={(v) => updateWorkExperience(w.id, { startDate: v })} />
                  </div>
                  <div>
                    <label htmlFor={`end-${w.id}-month`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">End Date</label>
                    <MonthYearSelect idPrefix={`end-${w.id}`} value={isCurrent ? "" : w.endDate} onChange={(v) => updateWorkExperience(w.id, { endDate: v })} disabled={isCurrent} />
                    <label className="mt-2 inline-flex cursor-pointer select-none items-center gap-2">
                      <input type="checkbox" checked={isCurrent} onChange={(e) => updateWorkExperience(w.id, { endDate: e.target.checked ? "Present" : "" })} className="rounded border-slate-500 bg-slate-900 text-cyan-400 focus:ring-cyan-500" />
                      <span className="text-xs text-slate-300">Currently working here</span>
                    </label>
                  </div>
                </div>

                {/* Description - rich text editor */}
                <div>
                  <label htmlFor={`description-${w.id}`} className="mb-1.5 block break-words text-xs font-semibold uppercase tracking-wide text-slate-300">Description</label>
                  <DescriptionEditor
                    id={`description-${w.id}`}
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
        type="button"
        onClick={addWorkExperience}
        className="mt-4 min-h-[44px] w-full rounded-xl border-2 border-dashed border-white/10 bg-white/3 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-cyan-100"
      >
        + Add Position
      </button>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="crp-btn crp-btn-secondary min-h-[44px] w-full md:w-auto"
        >
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="crp-btn crp-btn-primary min-h-[44px] w-full md:w-auto"
        >
          Next: Education
        </button>
      </div>
    </div>
  );
}

