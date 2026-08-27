"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const themes = [
    {
      id: "light",
      label: t("light"),
      icon: Sun,
      colorClass: "text-amber-500",
    },
    {
      id: "dark",
      label: t("dark"),
      icon: Moon,
      colorClass: "text-blue-400",
    },
    {
      id: "system",
      label: t("system"),
      icon: Monitor,
      colorClass: "text-muted-foreground",
    },
  ] as const;

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-lg text-muted-foreground"
        aria-label="Theme switcher placeholder"
        disabled
      >
        <Sun className="size-4.5 animate-pulse" />
      </Button>
    );
  }

  const currentTheme = themes.find((item) => item.id === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative inline-block text-start" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-10 rounded-lg transition-colors text-muted-foreground",
          "hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
          isOpen && "bg-muted text-foreground"
        )}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t("title")}
        title={t("title")}
      >
        <CurrentIcon className={cn("size-5", currentTheme.colorClass)} />
        <span className="sr-only">{t("title")}</span>
      </Button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "absolute end-0 mt-1.5 w-48 z-50 rounded-xl border bg-popover/95 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150 text-popover-foreground"
          )}
        >
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            {t("title")}
          </div>
          {themes.map((item) => {
            const Icon = item.icon;
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                role="menuitem"
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer text-start min-h-[38px]",
                  isSelected
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-foreground hover:bg-muted/70 hover:text-foreground"
                )}
                onClick={() => {
                  setTheme(item.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={cn("size-4 shrink-0", item.colorClass)} />
                  <span className="truncate">{item.label}</span>
                </div>
                {isSelected && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
