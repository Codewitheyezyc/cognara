import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, style, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "placeholder-[var(--input-placeholder)] focus-visible:border-[var(--input-focus-border)] focus:border-[var(--input-focus-border)] transition-colors duration-150",
        className
      )}
      style={{
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border)',
        color: 'var(--input-text)',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '15px',
        outline: 'none',
        width: '100%',
        ...style
      }}
      {...props}
    />
  )
}

export { Input }
