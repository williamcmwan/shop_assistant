import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleClick = () => {
      if (onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div
        className={cn(
          "relative flex h-4 w-4 items-center justify-center rounded border border-gray-300 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2",
          checked && "bg-yellow-400 border-yellow-400",
          className
        )}
        onClick={handleClick}
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={() => {}} // Controlled by parent
          className="sr-only"
          {...props}
        />
        {checked && (
          <Check className="h-3 w-3 text-white" />
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
