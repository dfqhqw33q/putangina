"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title?: string
  titleFilipino?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, titleFilipino, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-medium" title={titleFilipino}>
              {title}
            </h3>
          )}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

interface FormRowProps {
  children: React.ReactNode
  className?: string
}

export function FormRow({ children, className }: FormRowProps) {
  return <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>
}

interface FormFieldWrapperProps {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function FormFieldWrapper({ children, className, fullWidth }: FormFieldWrapperProps) {
  return <div className={cn("space-y-2", fullWidth && "sm:col-span-2 lg:col-span-3", className)}>{children}</div>
}
