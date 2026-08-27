"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchesMultiToken } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface SearchableSelectItem {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  keywords?: (string | number | null | undefined)[];
}

export interface SearchableSelectProps {
  items: SearchableSelectItem[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

export function SearchableSelect({
  items,
  value,
  onChange,
  placeholder = "اختر...",
  searchPlaceholder = "بحث سريع...",
  emptyText = "لا توجد نتائج مطابقة",
  disabled = false,
  className,
  allowClear = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Selected Item
  const selectedItem = useMemo(
    () => items.find((it) => it.id === value),
    [items, value]
  );

  // Filtered Items via fast multi-token matcher
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((it) =>
      matchesMultiToken(query, [
        it.label,
        it.sublabel,
        it.badge,
        ...(it.keywords || []),
      ])
    );
  }, [items, query]);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && (open ? handleClose() : setOpen(true))}
        className={cn(
          "w-full justify-between font-normal text-xs h-9 px-3 bg-background",
          !selectedItem && "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2 truncate text-start">
          {selectedItem ? (
            <>
              <span className="font-medium text-foreground truncate">
                {selectedItem.label}
              </span>
              {selectedItem.sublabel && (
                <span className="text-muted-foreground text-[11px] truncate">
                  ({selectedItem.sublabel})
                </span>
              )}
              {selectedItem.badge && (
                <Badge
                  variant={selectedItem.badgeVariant || "secondary"}
                  className="text-[10px] py-0 px-1 font-normal shrink-0"
                >
                  {selectedItem.badge}
                </Badge>
              )}
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && selectedItem && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "size-3.5 opacity-50 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </Button>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden animate-in fade-in-0 zoom-in-95">
          {/* Search Box */}
          <div className="flex items-center border-b px-2 py-1.5 gap-1.5">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-7 text-xs border-0 shadow-none focus-visible:ring-0 px-1"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleClose();
                } else if (e.key === "Enter" && filteredItems.length > 0) {
                  e.preventDefault();
                  onChange(filteredItems[0].id);
                  handleClose();
                }
              }}
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuery("")}
                className="size-6 text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1 text-xs">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === value;
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(item.id);
                      handleClose();
                    }}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
                      isSelected && "bg-accent/60 font-medium"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-muted-foreground text-[11px] shrink-0">
                          {item.sublabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || "secondary"}
                          className="text-[10px] py-0 px-1 font-normal"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {isSelected && <Check className="size-3.5 text-primary" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
