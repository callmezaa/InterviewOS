import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-primary/10 border-primary/20 text-primary-on-dark",
        success: "bg-success/10 border-success/20 text-success-soft",
        warning: "bg-warning/10 border-warning/20 text-warning-soft",
        danger: "bg-danger/10 border-danger/20 text-danger-soft",
        neutral: "bg-white/[0.04] border-white/[0.06] text-white/60",
        solid: "bg-primary text-on-primary-solid",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[9px] font-mono",
        md: "px-2.5 py-0.5 text-[11px] font-mono",
        lg: "px-3 py-1 text-[11px] font-mono",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size,
  dot,
  dotColor,
  render,
  children,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & {
  dot?: boolean;
  dotColor?: string;
}) {
  const dotElement = dot ? (
    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor ?? "bg-current")} />
  ) : null;

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
        children: dotElement ? <>{dotElement}{children}</> : children,
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
