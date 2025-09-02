import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#a06ba5] text-white shadow hover:bg-[#8a5497]",
        destructive:
          "bg-[#e11d48] text-white shadow-sm hover:bg-[#be123c]",
        outline:
          "border border-black bg-white text-black shadow-sm hover:bg-gray-100 hover:text-black",
        secondary:
          "bg-[#ede9fe] text-[#7c3aed] shadow-sm hover:bg-[#e9d5ff]",
        ghost: "bg-white text-[#a06ba5] hover:bg-[#f3e8ff] hover:text-[#a06ba5]",
        link: "text-[#a06ba5] underline-offset-4 hover:underline bg-white",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 