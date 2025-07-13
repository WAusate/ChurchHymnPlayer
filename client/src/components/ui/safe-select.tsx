"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SafeSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  children: React.ReactNode
  className?: string
}

interface SafeSelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SafeSelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {},
})

const SafeSelect = ({ value, onValueChange, placeholder, children, className }: SafeSelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      } catch (error) {
        // Silently handle DOM access errors
        console.warn('Select click outside error:', error)
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        try {
          document.removeEventListener('mousedown', handleClickOutside)
        } catch (error) {
          console.warn('Select cleanup error:', error)
        }
      }
    }
  }, [isOpen])

  // Close dropdown on escape key
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        try {
          document.removeEventListener('keydown', handleKeyDown)
        } catch (error) {
          console.warn('Select keyboard cleanup error:', error)
        }
      }
    }
  }, [isOpen])

  const contextValue = React.useMemo(() => ({
    value,
    onValueChange,
    isOpen,
    setIsOpen,
  }), [value, onValueChange, isOpen])

  return (
    <SafeSelectContext.Provider value={contextValue}>
      <div ref={selectRef} className={cn("relative", className)}>
        <SafeSelectTrigger placeholder={placeholder} />
        {isOpen && (
          <SafeSelectContent>
            {children}
          </SafeSelectContent>
        )}
      </div>
    </SafeSelectContext.Provider>
  )
}

const SafeSelectTrigger = ({ placeholder }: { placeholder?: string }) => {
  const { value, isOpen, setIsOpen } = React.useContext(SafeSelectContext)

  const handleClick = () => {
    try {
      setIsOpen(!isOpen)
    } catch (error) {
      console.warn('Select trigger error:', error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>span]:line-clamp-1"
      )}
    >
      <span className={cn(!value && "text-muted-foreground")}>
        {value || placeholder}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

const SafeSelectContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={cn(
      "absolute top-full left-0 right-0 z-50 mt-1",
      "max-h-60 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md",
      "animate-in fade-in-0 zoom-in-95"
    )}>
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

const SafeSelectItem = ({ value, children, className }: SafeSelectItemProps) => {
  const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SafeSelectContext)
  const isSelected = value === selectedValue

  const handleClick = () => {
    try {
      onValueChange?.(value)
      setIsOpen(false)
    } catch (error) {
      console.warn('Select item error:', error)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm",
        "outline-none hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
}

export { SafeSelect, SafeSelectItem }