import * as React from "react"

type AlertProps = React.HTMLAttributes<HTMLDivElement>

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`relative w-full rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm text-gray-600 ${className}`}
      {...props}
    />
  )
)
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }