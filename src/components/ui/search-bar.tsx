"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchBarProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, onSearch, debounceMs = 300, onChange, value: _value, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState("");
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    React.useEffect(() => {
      if (onSearch == null) return;
      if (debounceMs <= 0) {
        onSearch(localValue);
        return;
      }
      timeoutRef.current = setTimeout(() => {
        onSearch(localValue);
      }, debounceMs);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [localValue, onSearch, debounceMs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div className={cn("relative", className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={ref}
          type="search"
          role="searchbox"
          aria-label={props["aria-label"] ?? "Search"}
          placeholder={props.placeholder ?? "Search…"}
          value={localValue}
          onChange={handleChange}
          className="pl-9"
          {...props}
        />
      </div>
    );
  },
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
