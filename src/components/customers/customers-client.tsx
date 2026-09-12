"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerListResult } from "@/services/customers";
import { CustomerKpiCards } from "@/components/customers/customer-kpi-cards";
import { CustomerFilterBar } from "@/components/customers/customer-filter-bar";
import { CustomerTable } from "@/components/customers/customer-table";
import { cn } from "@/lib/utils";

interface CustomersClientProps {
  initialData: CustomerListResult;
}

export function CustomersClient({ initialData }: CustomersClientProps) {
  const t = useTranslations("customers");
  const tFilters = useTranslations("customers.filters");

  const [data, setData] = React.useState<CustomerListResult>(initialData);
  const [search, setSearch] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [segment, setSegment] = React.useState<string>("");
  const [hasProblems, setHasProblems] = React.useState<boolean>(false);
  const [page, setPage] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Debounce search input by 300ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch customers from API
  const fetchCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "25");
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (segment && segment !== "ALL") {
        params.set("segment", segment);
      }
      if (hasProblems) {
        params.set("hasProblems", "true");
      }

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch customers");
      }
      const json: CustomerListResult = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, segment, hasProblems]);

  // Trigger fetch when filters or page changes (skip on very first mount if matching initial)
  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSegmentChange(newSegment: string) {
    setSegment(newSegment);
    setPage(1);
  }

  function handleHasProblemsToggle() {
    setHasProblems((prev) => !prev);
    setPage(1);
  }

  function handleReset() {
    setSearch("");
    setDebouncedSearch("");
    setSegment("");
    setHasProblems(false);
    setPage(1);
  }

  const handleExport = React.useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    if (segment && segment !== "ALL") {
      params.set("segment", segment);
    }
    if (hasProblems) {
      params.set("hasProblems", "true");
    }
    const url = `/api/customers/export${params.toString() ? `?${params.toString()}` : ""}`;
    window.open(url, "_blank");
  }, [debouncedSearch, segment, hasProblems]);

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            className="h-10 gap-2 text-xs sm:text-sm font-medium border-border/70 shadow-2xs hover:bg-muted/80"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{tFilters("exportExcel")}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={fetchCustomers}
            disabled={isLoading}
            className="h-10 gap-2 text-xs sm:text-sm font-medium border-border/70 shadow-2xs hover:bg-muted/80"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">{tFilters("refresh")}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <CustomerKpiCards stats={data.stats} isLoading={isLoading} />

      {/* Filter Bar */}
      <CustomerFilterBar
        search={search}
        onSearchChange={setSearch}
        segment={segment}
        onSegmentChange={handleSegmentChange}
        hasProblems={hasProblems}
        onHasProblemsToggle={handleHasProblemsToggle}
        onReset={handleReset}
        onRefresh={fetchCustomers}
        onExport={handleExport}
        isLoading={isLoading}
      />

      {/* Customer Directory Table */}
      <CustomerTable
        customers={data.customers}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
        limit={data.limit}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
