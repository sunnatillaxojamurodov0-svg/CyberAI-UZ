import { cn } from "@/lib/utils";

interface IOSSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
}

export function IOSSwitch({ checked, onChange, className, label }: IOSSwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-2 cursor-pointer", className)}>
      <div className="relative w-[51px] h-[31px]">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-[16px] transition-all duration-200 ease-out",
            checked ? "bg-primary" : "bg-muted",
          )}
        />
        <div
          className={cn(
            "absolute top-[2px] size-[27px] rounded-full bg-white shadow-[0px_3px_8px_rgba(0,0,0,0.15),0px_3px_1px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out",
            checked ? "left-[22px]" : "left-[2px]",
          )}
        />
      </div>
      {label && <span className="text-sm font-medium text-muted-foreground">{label}</span>}
    </label>
  );
}
