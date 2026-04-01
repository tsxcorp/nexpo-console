import { ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  asChild?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  asChild = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nexpo-500/50 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    primary:
      "bg-nexpo-500 text-white hover:bg-nexpo-600 active:bg-nexpo-700 shadow-lg shadow-nexpo-500/25",
    secondary:
      "bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-100 hover:bg-surface-200 dark:hover:bg-surface-600 border border-surface-200 dark:border-surface-600",
    outline:
      "border-2 border-nexpo-500 bg-transparent hover:bg-nexpo-500 text-nexpo-500 hover:text-white",
    ghost:
      "bg-transparent hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-6",
    lg: "h-14 px-8 text-base",
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Comp>
  );
}
