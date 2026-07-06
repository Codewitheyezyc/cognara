'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ 
  value, 
  onChange,
  placeholder = "Write your post here... Share what you learned, how it helped you, and what you would tell someone just starting out."
}: RichTextEditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-500 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-surface-alt border border-border rounded-xl p-4 font-mono text-sm text-text-1',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep the editor content in sync with the value prop (e.g. initial load or reset)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card focus-within:border-primary/50 transition-colors">

      {/* TOOLBAR */}
      <div className="border-b border-border/80 p-3 flex flex-wrap gap-1 bg-surface-alt/40">

        {/* Text formatting */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <strong>B</strong>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <em>I</em>
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <s>S</s>
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Lists */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            • List
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Numbered list"
          >
            1. List
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Quote and Code */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Quote"
          >
            &ldquo; Quote
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline code"
          >
            {'</>'}
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Code block"
          >
            Code block
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          title="Add link"
        >
          🔗 Link
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          title="Add image"
        >
          📷 Image
        </ToolbarButton>

        <ToolbarDivider />

        {/* Undo / Redo */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            ↩ Undo
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            ↪ Redo
          </ToolbarButton>
        </ToolbarGroup>

        {/* Character count */}
        <div className="ml-auto flex items-center">
          <span className="text-[10px] text-text-3 px-2 py-1 bg-surface-alt rounded-lg font-mono font-bold select-none border border-border/60">
            {editor.storage.characterCount.characters()} characters
          </span>
        </div>

      </div>

      {/* EDITOR WRITING AREA */}
      <EditorContent
        editor={editor}
        className="min-h-[400px] p-6 text-text-1 bg-transparent focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[350px] leading-relaxed text-sm font-sans"
      />

    </div>
  );
}

// Toolbar helper components
function ToolbarButton({ 
  onClick, 
  active, 
  disabled,
  title,
  children 
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        px-2.5 py-1.5 rounded-lg text-xs 
        font-bold transition-all select-none
        ${active 
          ? 'bg-primary text-white shadow-xs' 
          : 'text-text-2 hover:bg-surface-alt hover:text-text-1'
        }
        ${disabled 
          ? 'opacity-40 cursor-not-allowed' 
          : 'cursor-pointer'
        }
      `}
    >
      {children}
    </button>
  );
}

function ToolbarGroup({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="flex items-center gap-0.5">
      {children}
    </div>
  );
}

function ToolbarDivider() {
  return (
    <div className="w-px h-6 bg-border/80 mx-1.5 self-center" />
  );
}
