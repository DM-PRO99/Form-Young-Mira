'use client'

import { useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  // Sube la imagen y devuelve su URL pública; si no se pasa, se oculta el botón de imagen.
  onUploadImage?: (file: File) => Promise<string>
  minHeight?: number
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'press inline-flex items-center justify-center w-8 h-8 rounded-[8px] transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20 disabled:opacity-30 disabled:pointer-events-none',
        active ? 'bg-primary-tint text-primary' : 'text-ink-muted hover:bg-canvas hover:text-ink'
      )}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <span className="w-px h-5 bg-border mx-0.5" aria-hidden />
}

function LinkBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState<string>(editor.getAttributes('link').href ?? 'https://')
  function aplicar(e: React.FormEvent) {
    e.preventDefault()
    const limpio = url.trim()
    if (!limpio || limpio === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else if (!/^(https:\/\/|mailto:)/i.test(limpio)) {
      toast.error('El enlace debe empezar por https:// o mailto:')
      return
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: limpio }).run()
    }
    onClose()
  }
  return (
    <form onSubmit={aplicar} className="flex items-center gap-2 px-2 py-2 border-b border-border bg-surface-muted">
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        placeholder="https://…"
        aria-label="Dirección del enlace"
        className="flex-1 min-w-0 h-8 px-2.5 text-[13px] bg-white border border-border-input rounded-[8px] outline-none focus:border-primary"
      />
      <button type="submit" className="press h-8 px-3 rounded-[8px] bg-primary text-white text-[12.5px] font-semibold">
        Aplicar
      </button>
      {editor.isActive('link') && (
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            onClose()
          }}
          className="h-8 px-2.5 text-[12.5px] font-medium text-danger hover:underline"
        >
          Quitar
        </button>
      )}
    </form>
  )
}

export default function RichTextEditor({ value, onChange, placeholder, onUploadImage, minHeight = 180 }: RichTextEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [linkAbierto, setLinkAbierto] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, protocols: ['https', 'mailto'] },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: placeholder ?? 'Escribe aquí la teoría…' }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'prose-mira outline-none px-4 py-3', style: `min-height:${minHeight}px` },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? '' : editor.getHTML()),
  })

  async function subirImagen(file: File) {
    if (!editor || !onUploadImage) return
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      toast.error('Usa una imagen PNG, JPG, WEBP o GIF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen supera 10 MB.')
      return
    }
    setSubiendo(true)
    try {
      const src = await onUploadImage(file)
      editor.chain().focus().setImage({ src, alt: file.name.replace(/\.[^.]+$/, '') }).run()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo subir la imagen')
    } finally {
      setSubiendo(false)
    }
  }

  if (!editor) {
    return <div className="rounded-field border border-border-input bg-white animate-pulse" style={{ minHeight: minHeight + 44 }} />
  }

  return (
    <div className="rounded-field border border-border-input bg-white overflow-hidden focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/[0.16] transition-[border-color,box-shadow] duration-150">
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-border bg-surface-muted">
        <ToolbarButton label="Título" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <ToolbarButton label="Subtítulo" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <Separator />
        <ToolbarButton label="Negrilla" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" strokeWidth={2.2} />
        </ToolbarButton>
        <ToolbarButton label="Cursiva" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <ToolbarButton label="Subrayado" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <ToolbarButton label="Tachado" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <Separator />
        <ToolbarButton label="Lista con viñetas" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <ToolbarButton label="Lista numerada" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <ToolbarButton label="Cita" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <ToolbarButton label="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <Separator />
        <ToolbarButton label="Enlace" active={editor.isActive('link') || linkAbierto} onClick={() => setLinkAbierto((v) => !v)}>
          <Link2 className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        {onUploadImage && (
          <ToolbarButton label="Insertar imagen" disabled={subiendo} onClick={() => fileRef.current?.click()}>
            {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" strokeWidth={1.9} />}
          </ToolbarButton>
        )}
        <span className="flex-1" />
        <ToolbarButton label="Deshacer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
        <ToolbarButton label="Rehacer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="w-4 h-4" strokeWidth={1.9} />
        </ToolbarButton>
      </div>
      {linkAbierto && <LinkBar editor={editor} onClose={() => setLinkAbierto(false)} />}
      <EditorContent editor={editor} />
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void subirImagen(file)
        }}
      />
    </div>
  )
}
