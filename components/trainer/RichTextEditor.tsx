'use client'
import { useRef, useEffect } from 'react'
import { Bold, Underline, Italic, Heading2, List, ListOrdered, Pilcrow } from 'lucide-react'

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || ''
      initialized.current = true
    }
  }, [value])

  function exec(command: string, arg?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, arg)
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }

  const buttons = [
    { icon: Bold, command: 'bold', label: 'عريض' },
    { icon: Italic, command: 'italic', label: 'مائل' },
    { icon: Underline, command: 'underline', label: 'تحته خط' },
    { icon: Heading2, command: 'formatBlock', arg: '<h3>', label: 'عنوان' },
    { icon: Pilcrow, command: 'formatBlock', arg: '<p>', label: 'نص عادي' },
    { icon: List, command: 'insertUnorderedList', label: 'قائمة نقطية' },
    { icon: ListOrdered, command: 'insertOrderedList', label: 'قائمة مرقّمة' },
  ]

  return (
    <div className="border border-ruwad-gray rounded-ruwad-sm overflow-hidden">
      <div className="flex items-center gap-1 bg-ruwad-gray/20 p-2 border-b border-ruwad-gray flex-wrap">
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={() => exec(b.command, b.arg)}
            title={b.label}
            className="p-2 rounded-ruwad-sm hover:bg-white text-ruwad-navy transition"
          >
            <b.icon size={16} />
          </button>
        ))}
        <div className="w-px h-5 bg-ruwad-gray mx-1" />
        {['#3A4EFB', '#252943', '#E3FF3B'].map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => exec('foreColor', color)}
            title="لون النص"
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={() => editorRef.current && onChange(editorRef.current.innerHTML)}
        className="min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3 outline-none text-ruwad-navy leading-relaxed [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pr-5 [&_ol]:list-decimal [&_ol]:pr-5"
        suppressContentEditableWarning
      />
    </div>
  )
}
