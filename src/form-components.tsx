import { Check } from "lucide-react";
import React from "react";
import { cn } from "./lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { FormItem, FormControl, FormLabel } from "./components/ui/form";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  return (
    <div className={cn("flex h-4 w-4 *:h-full *:w-full", className)}>
      <input
        type="checkbox"
        className={cn(
          "cursor-pointer appearance-none",
          "peer shrink-0 rounded-sm border border-primary shadow",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "checked:bg-primary checked:text-primary-foreground"
        )}
        ref={ref}
        {...props}
      />
      <Check className="text-background pointer-events-none ml-[-100%] invisible peer-checked:visible" />
    </div>
  );
});
Checkbox.displayName = "Checkbox";

function ToggleGroup<TOption = string>(props: {
  options: TOption[];
  children: (this: void, value: TOption, idx: number) => JSX.Element;
  className?: string;
}) {
  const { options, children, className } = props;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-1 *:flex-1",
        className
      )}
    >
      {options.map(children)}
    </div>
  );
}

const radioVariants = cva(
  cn(
    "rounded-md text-sm font-medium transition-colors",
    "hover:bg-muted hover:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "checked:bg-accent checked:text-accent-foreground"
  ),
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface RadioButtonProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof radioVariants> {
  label: string;
  type: "single" | "multiple";
}

const RadioButton = React.forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ className, variant, size, label, type, ...props }, ref) => {
    return (
      <FormItem
        className={cn("flex flex-row items-center gap-0 *:w-full", className)}
      >
        <FormControl>
          <input
            type={type === "single" ? "radio" : "checkbox"}
            className={cn(
              radioVariants({ variant, size }),
              "appearance-none cursor-pointer"
            )}
            ref={ref}
            {...props}
          />
        </FormControl>
        <FormLabel className="pointer-events-none text-center ml-[-100%]">
          {label}
        </FormLabel>
      </FormItem>
    );
  }
);
RadioButton.displayName = "RadioButton";

export { Checkbox, type RadioButtonProps, RadioButton, ToggleGroup };
