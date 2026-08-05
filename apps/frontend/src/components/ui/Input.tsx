import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

const inputSizeClasses = {
  sm: "h-7 py-0.5 px-2.5 text-[13px]",
  md: "py-2.5 px-2.5",
  lg: "py-3 px-3 text-[15px]",
} as const;

function Input({
  className,
  type,
  label,
  icon: Icon,
  error,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> & {
  label?: string;
  icon?: React.ElementType;
  error?: string | boolean;
  size?: keyof typeof inputSizeClasses;
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  const hasError = !!error;
  const errorMsg = typeof error === "string" ? error : undefined;
  const isPassword = type === "password";
  const actualType = isPassword ? (showPassword ? "text" : "password") : type;

  const input = (
    <InputPrimitive
      type={actualType}
      data-slot="input"
      aria-invalid={hasError || undefined}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        Icon && "pl-9",
        isPassword && "pr-9",
        size && inputSizeClasses[size],
        className
      )}
      {...props}
    />
  );

  if (!label && !Icon && !error && !size && !isPassword) return input;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          className="text-[13px] font-medium text-foreground/60"
          htmlFor={props.id}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
        {input}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
    </div>
  )
}

export { Input }
