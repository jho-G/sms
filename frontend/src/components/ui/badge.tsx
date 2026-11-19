import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
        destructive:
          "border-transparent bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-600",
        outline: "text-foreground border-gray-300 dark:border-gray-700",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-400",
        info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-400",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "destructive" && "bg-rose-500",
            variant === "info" && "bg-sky-500",
            variant === "default" && "bg-white",
            (!variant || variant === "secondary") && "bg-gray-500"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
