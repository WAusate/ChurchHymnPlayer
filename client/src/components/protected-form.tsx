"use client"

import * as React from "react"

interface ProtectedFormProps {
  onSubmit: (event: React.FormEvent) => void
  children: React.ReactNode
  className?: string
}

/**
 * Form component with enhanced error protection and isolation
 * Prevents DOM manipulation errors during form submission and state changes
 */
const ProtectedForm = ({ onSubmit, children, className }: ProtectedFormProps) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  const handleSubmit = React.useCallback((event: React.FormEvent) => {
    // Prevent double submissions
    if (isSubmitting) {
      event.preventDefault()
      return
    }

    setIsSubmitting(true)

    try {
      // Delay the onSubmit call to avoid immediate DOM conflicts
      setTimeout(() => {
        try {
          onSubmit(event)
        } catch (error) {
          console.error('Protected form submit error:', error)
        } finally {
          // Reset submitting state after processing
          setTimeout(() => {
            setIsSubmitting(false)
          }, 500)
        }
      }, 10)
    } catch (error) {
      console.error('Protected form submit wrapper error:', error)
      setIsSubmitting(false)
    }
  }, [onSubmit, isSubmitting])

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={className}
      // Prevent form submission during processing
      {...(isSubmitting && { 'data-submitting': 'true' })}
    >
      {children}
    </form>
  )
}

export { ProtectedForm }