import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:shadow-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        outline: "border-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-background",
        secondary: "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary hover:bg-transparent shadow-none hover:shadow-none hover:-translate-y-0",
      },
      size: {
        default: "h-12 py-2 px-6",
        sm: "h-10 px-4 rounded-lg",
        lg: "h-14 px-10 rounded-2xl text-lg",
        icon: "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }