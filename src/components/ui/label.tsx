"use client"

import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-semibold leading-none text-gray-700 mb-2 block ${className || ''}`}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
