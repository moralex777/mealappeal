"use client"

import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
      <input
        type={type}
        className={`flex h-12 w-full rounded-xl border-2 border-white/30 bg-white/95 px-4 py-3 text-base font-medium text-gray-900 backdrop-blur-sm transition-all duration-200 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:border-orange-400 focus-visible:bg-white/98 hover:bg-white/98 hover:border-orange-300 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md focus-visible:shadow-lg ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
)
Input.displayName = "Input"

export { Input }
