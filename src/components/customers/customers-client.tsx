"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CustomerListResult } from "@/services/customers";
import { CustomerKpiCards } from "@/components/customers/customer-kpi-cards";
import { CustomerFilterBar } from "@/components/customers/customer-filter-bar";
import { CustomerTable } from "@/components/customers/customer-table";

interface CustomersClientProps {
  initialData: CustomerListResult;
}

export function CustomersClient({ initialData }: CustomersClientProps) {
  const t = useTranslations("customers");

  const [data, setData] = React.useState<CustomerListResult>(initialData);
  const [search, setSearch] = React.useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>("");
  const [tier, setTier] = React.useState<string>("");
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
      if (tier) {
        params.set("tier", tier);
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
  }, [page, debouncedSearch, tier, hasProblems]);

  // Trigger fetch when filters or page changes (skip on very first mount if matching initial)
  const isFirstMount = React.useRef(true);
  React.useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    fetchCustomers();
  }, [fetchCustomers]);

  function handleTierChange(newTier: string) {
    setTier(newTier);
    setPage(1);
  }

  function handleHasProblemsToggle() {
    setHasProblems((prev) => !prev);
    setPage(1);
  }

  function handleReset() {
    setSearch("");
    setDebouncedSearch("");
    setTier("");
    setHasProblems(false);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* KPI Cards */}
      <CustomerKpiCards stats={data.stats} isLoading={isLoading} />

      {/* Filter Bar */}
      <CustomerFilterBar
        search={search}
        onSearchChange={setSearch}
        tier={tier}
        onTierChange={handleTierChange}
        hasProblems={hasProblems}
        onHasProblemsToggle={handleHasProblemsToggle}
        onReset={handleReset}
        onRefresh={fetchCustomers}
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
