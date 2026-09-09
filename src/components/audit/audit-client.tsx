"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Role, AuditAction } from "@prisma/client";
import {
  Activity,
  Clock,
  ArrowRightLeft,
  ShieldAlert,
  Download,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AuditFilterBar,
  type AuditFilterState,
  type AuditDatePreset,
} from "@/components/audit/audit-filter-bar";
import { AuditTable } from "@/components/audit/audit-table";
import { AuditDiffDialog } from "@/components/audit/audit-diff-dialog";
import type { AuditLogWithUser, AuditSummaryStats } from "@/lib/auditDiff";
import { cn } from "@/lib/utils";

interface AuditClientProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  initialData: {
    logs: AuditLogWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    stats: AuditSummaryStats;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: Role;
  }>;
}

function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AuditClient({
  currentUser,
  initialData,
  users,
}: AuditClientProps) {
  const t = useTranslations("audit");

  const [logs, setLogs] = React.useState<AuditLogWithUser[]>(initialData.logs);
  const [total, setTotal] = React.useState<number>(initialData.total);
  const [page, setPage] = React.useState<number>(initialData.page);
  const [limit, setLimit] = React.useState<number>(initialData.limit);
  const [totalPages, setTotalPages] = React.useState<number>(initialData.totalPages);
  const [stats, setStats] = React.useState<AuditSummaryStats>(initialData.stats);

  const [filters, setFilters] = React.useState<AuditFilterState>({});
  const [activePreset, setActivePreset] = React.useState<AuditDatePreset>("allTime");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  // Selected Log for Diff Modal
  const [selectedLog, setSelectedLog] = React.useState<AuditLogWithUser | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = React.useState(false);

  const isInitialMount = React.useRef(true);

  // Fetch data from /api/audit
  const fetchLogs = React.useCallback(
    async (currentPage = page, currentLimit = limit, currentFilters = filters) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(currentLimit));

        if (currentFilters.action) params.set("action", currentFilters.action);
        if (currentFilters.entityType) params.set("entityType", currentFilters.entityType);
        if (currentFilters.userId) params.set("userId", currentFilters.userId);
        if (currentFilters.startDate) params.set("startDate", currentFilters.startDate);
        if (currentFilters.endDate) params.set("endDate", currentFilters.endDate);
        if (currentFilters.search) params.set("search", currentFilters.search);

        const res = await fetch(`/api/audit?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch audit data");
        }

        const json = await res.json();
        if (json.success && json.data) {
          setLogs(json.data.logs);
          setTotal(json.data.total);
          setPage(json.data.page);
          setLimit(json.data.limit);
          setTotalPages(json.data.totalPages);
          if (json.data.stats) {
            setStats(json.data.stats);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit, filters]
  );

  // Re-fetch on filter or page change
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchLogs(page, limit, filters);
  }, [page, limit, filters, fetchLogs]);

  // Handle Preset Change
  const handlePresetChange = (preset: "today" | "yesterday" | "last7Days" | "thisMonth" | "allTime") => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === "allTime") {
      setFilters((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
      setPage(1);
      return;
    }

    if (preset === "today") {
      const dateStr = formatDateString(now);
      setFilters((prev) => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
      }));
      setPage(1);
      return;
    }

    if (preset === "yesterday") {
      const yest = new Date(now.getTime() - 86400000);
      const dateStr = formatDateString(yest);
      setFilters((prev) => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
      }));
      setPage(1);
      return;
    }

    if (preset === "last7Days") {
      const d7 = new Date(now.getTime() - 6 * 86400000);
      setFilters((prev) => ({
        ...prev,
        startDate: formatDateString(d7),
        endDate: formatDateString(now),
      }));
      setPage(1);
      return;
    }

    if (preset === "thisMonth") {
      const d1 = new Date(now.getFullYear(), now.getMonth(), 1);
      setFilters((prev) => ({
        ...prev,
        startDate: formatDateString(d1),
        endDate: formatDateString(now),
      }));
      setPage(1);
      return;
    }
  };

  // Handle manual filter change
  const handleFilterChange = (changes: Partial<AuditFilterState>) => {
    setFilters((prev) => ({ ...prev, ...changes }));
    setPage(1);
  };

  // Reset all filters
  const handleReset = () => {
    setActivePreset("allTime");
    setFilters({});
    setPage(1);
  };

  // Open Diff Modal
  const handleViewDiff = (log: AuditLogWithUser) => {
    setSelectedLog(log);
    setDiffDialogOpen(true);
  };

  // Export CSV with UTF-8 BOM for Arabic compatibility in Excel
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      // Fetch matching logs up to 1000 records
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "1000");

      if (filters.action) params.set("action", filters.action);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const json = await res.json();
      const exportLogs: AuditLogWithUser[] = json.data?.logs || logs;

      const escapeCell = (val: any): string => {
        if (val == null) return '""';
        let str = typeof val === "object" ? JSON.stringify(val) : String(val);
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      };

      const headers = [
        "معرّف الحدث (Event ID)",
        "الوقت والتاريخ (Timestamp)",
        "المستخدم (User)",
        "البريد الإلكتروني (Email)",
        "الصلاحية (Role)",
        "نوع الإجراء (Action)",
        "الكيان (Entity)",
        "معرّف الكيان (Entity ID)",
        "القيمة السابقة (Old Value)",
        "القيمة الجديدة (New Value)",
      ];

      const csvRows = [headers.map(escapeCell).join(",")];

      for (const item of exportLogs) {
        csvRows.push(
          [
            item.id,
            new Date(item.timestamp).toISOString(),
            item.user.name,
            item.user.email,
            item.user.role,
            item.action,
            item.entityType,
            item.entityId,
            item.oldValue,
            item.newValue,
          ]
            .map(escapeCell)
            .join(",")
        );
      }

      // Add UTF-8 BOM (\uFEFF)
      const csvString = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${formatDateString(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t("export.exportSuccess"));
    } catch (err) {
      console.error(err);
      toast.error(t("export.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("title")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ps-11">
            {t("subtitle")}
          </p>
        </div>

        {/* CSV Export Button */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="h-9 px-3.5 text-xs sm:text-sm font-semibold gap-1.5 shadow-2xs border-border/80 hover:bg-muted/80"
          >
            <Download className={cn("size-4", isExporting && "animate-bounce")} />
            <span>{isExporting ? t("export.exporting") : t("export.csvAction")}</span>
          </Button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Operations */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Activity className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("kpis.totalLogs")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.totalLogs}
            </span>
          </div>
        </div>

        {/* Today's Events */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Clock className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("kpis.todayEvents")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.todayCount}
            </span>
          </div>
        </div>

        {/* Status Transitions */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ArrowRightLeft className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("kpis.statusTransitions")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.statusChangeCount}
            </span>
          </div>
        </div>

        {/* Critical Operations */}
        <div className="flex items-center gap-3.5 p-4 rounded-xl border border-border/70 bg-card/70 shadow-2xs backdrop-blur-xs hover:border-border transition-colors">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="size-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-muted-foreground truncate">
              {t("kpis.criticalOps")}
            </span>
            <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.criticalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <AuditFilterBar
        filters={filters}
        activePreset={activePreset}
        users={users}
        onPresetChange={handlePresetChange}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onRefresh={() => fetchLogs(page, limit, filters)}
        isLoading={isLoading}
      />

      {/* Audit Data Table with Pagination */}
      <AuditTable
        logs={logs}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={(newPage) => setPage(newPage)}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        onViewDiff={handleViewDiff}
      />

      {/* Visual Diff Modal */}
      <AuditDiffDialog
        open={diffDialogOpen}
        onOpenChange={setDiffDialogOpen}
        log={selectedLog}
      />
    </div>
  );
}
