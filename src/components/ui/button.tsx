"use client"

import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'premium'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

// Export buttonVariants function for calendar component
export function buttonVariants({ variant = 'default', size = 'default', className = '' }: {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'premium'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}) {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95"
  
  const variantClasses = {
    default: "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-red-500 hover:to-purple-500 hover:scale-105 hover:shadow-lg shadow-md",
    outline: "border-2 border-white/30 bg-white/80 backdrop-blur-sm hover:bg-white/95 hover:border-orange-300 hover:scale-105 text-gray-700 hover:text-orange-700 shadow-md",
    secondary: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:scale-105 shadow-md",
    ghost: "hover:bg-white/20 hover:backdrop-blur-sm hover:scale-105",
    link: "text-orange-600 underline-offset-4 hover:underline hover:text-red-600 font-medium",
    premium: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-orange-500 hover:to-red-500 hover:scale-105 hover:shadow-lg shadow-md font-bold"
  }
  
  const sizeClasses = {
    default: "h-11 px-6 py-3",
    sm: "h-9 rounded-lg px-4 text-xs",
    lg: "h-12 rounded-xl px-8 text-base",
    icon: "h-10 w-10"
  }
  
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
