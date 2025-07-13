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
      try {
        event.preventDefault()
      } catch (error) {
        console.warn('Protected form prevent default error:', error)
      }
      return
    }

    setIsSubmitting(true)

    try {
      // Call the original onSubmit handler
      onSubmit(event)
    } catch (error) {
      console.error('Protected form submit error:', error)
    } finally {
      // Reset submitting state after a delay to prevent rapid re-submissions
      setTimeout(() => {
        setIsSubmitting(false)
      }, 1000)
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