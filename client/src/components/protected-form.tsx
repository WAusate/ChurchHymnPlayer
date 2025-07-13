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
      // Use requestAnimationFrame to prevent DOM manipulation conflicts
      requestAnimationFrame(() => {
        try {
          // Call the original onSubmit handler
          onSubmit(event)
        } catch (error) {
          console.error('Protected form submit error:', error)
        }
      })
    } catch (error) {
      console.error('Protected form RAF error:', error)
    } finally {
      // Reset submitting state after a longer delay to prevent rapid re-submissions and DOM conflicts
      setTimeout(() => {
        setIsSubmitting(false)
      }, 1500)
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