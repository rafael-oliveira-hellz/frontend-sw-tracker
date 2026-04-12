"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "./utils";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectContextValue = {
  value?: string;
  setValue: (value: string) => void;
  options: SelectOption[];
  triggerClassName?: string;
  triggerSize?: "sm" | "default";
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);

  if (!context) {
    throw new Error("Select components must be used within <Select>.");
  }

  return context;
}

const flattenText = (children: React.ReactNode): string => {
  if (children == null || typeof children === "boolean") {
    return "";
  }

  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => flattenText(child)).join("").trim();
  }

  if (React.isValidElement(children)) {
    return flattenText(children.props.children);
  }

  return "";
};

function collectOptions(children: React.ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  const visit = (node: React.ReactNode) => {
    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }

      if ((child.type as any)?.displayName === "LightSelectItem") {
        options.push({
          value: String(child.props.value),
          label: flattenText(child.props.children),
          disabled: Boolean(child.props.disabled),
        });
        return;
      }

      if (child.props?.children) {
        visit(child.props.children);
      }
    });
  };

  visit(children);
  return options;
}

function Select({
  value,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? value ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const options = React.useMemo(() => collectOptions(children), [children]);
  const [triggerClassName, setTriggerClassName] = React.useState<string | undefined>(undefined);
  const [triggerSize, setTriggerSize] = React.useState<"sm" | "default">("default");

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        setValue,
        options,
        triggerClassName,
        triggerSize,
      }}
    >
      <SelectTriggerConfigProvider setTriggerClassName={setTriggerClassName} setTriggerSize={setTriggerSize}>
        {children}
      </SelectTriggerConfigProvider>
    </SelectContext.Provider>
  );
}

type SelectTriggerConfigContextValue = {
  setTriggerClassName: (className?: string) => void;
  setTriggerSize: (size: "sm" | "default") => void;
};

const SelectTriggerConfigContext = React.createContext<SelectTriggerConfigContextValue | null>(null);

function SelectTriggerConfigProvider({
  children,
  setTriggerClassName,
  setTriggerSize,
}: {
  children: React.ReactNode;
  setTriggerClassName: (className?: string) => void;
  setTriggerSize: (size: "sm" | "default") => void;
}) {
  return (
    <SelectTriggerConfigContext.Provider value={{ setTriggerClassName, setTriggerSize }}>
      {children}
    </SelectTriggerConfigContext.Provider>
  );
}

function useSelectTriggerConfig() {
  const context = React.useContext(SelectTriggerConfigContext);

  if (!context) {
    throw new Error("SelectTrigger must be used within <Select>.");
  }

  return context;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "default";
}) {
  const { value, setValue, options } = useSelectContext();
  const { setTriggerClassName, setTriggerSize } = useSelectTriggerConfig();

  React.useEffect(() => {
    setTriggerClassName(className);
    setTriggerSize(size);
    return () => {
      setTriggerClassName(undefined);
      setTriggerSize("default");
    };
  }, [className, setTriggerClassName, setTriggerSize, size]);

  return (
    <div
      data-slot="select-trigger-wrapper"
      className={cn("relative w-full", props.className)}
    >
      <select
        data-slot="select-trigger"
        value={value ?? ""}
        onChange={(event) => setValue(event.target.value)}
        className={cn(
          "border-input bg-input-background text-foreground flex w-full appearance-none items-center justify-between gap-2 rounded-md border px-3 py-2 pr-9 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
          size === "default" ? "h-9" : "h-8",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
      <div className="hidden">{children}</div>
    </div>
  );
}

function SelectContent({ children }: { children?: React.ReactNode; className?: string }) {
  return <div className="hidden">{children}</div>;
}

function SelectValue() {
  return null;
}

function SelectItem({ children }: { value: string; children: React.ReactNode; className?: string; disabled?: boolean }) {
  return <>{children}</>;
}
SelectItem.displayName = "LightSelectItem";

function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function SelectSeparator() {
  return null;
}

function SelectScrollUpButton() {
  return null;
}

function SelectScrollDownButton() {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
