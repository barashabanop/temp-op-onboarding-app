import { useEffect, useLayoutEffect, useRef } from 'react'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  /** Describes the field for assistive technology, which has no visible label. */
  label: string
  placeholder?: string
  className?: string
}

/**
 * A text field that borrows the typography of the element it stands in for.
 *
 * Editing happens inside the real page rather than a separate form, so the
 * control has to grow with its content and inherit the surrounding styles
 * instead of imposing a textarea's own box.
 */
export function EditableText({ value, onChange, label, placeholder, className }: EditableTextProps) {
  const field = useRef<HTMLTextAreaElement>(null)

  const fit = () => {
    const element = field.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }

  useLayoutEffect(fit, [value])
  useEffect(() => {
    // The available width, and so the wrapped height, changes with the layout.
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <textarea
      ref={field}
      className={['editable-text', className].filter(Boolean).join(' ')}
      value={value}
      rows={1}
      spellCheck={false}
      aria-label={label}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
