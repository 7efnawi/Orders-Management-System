"use client";

import * as React from "react";
import { Role } from "@/types/enums";
import type { DashboardOverview } from "@/services/orders";
import { CashierDashboard } from "./cashier-dashboard";
import { ManagerDashboard } from "./manager-dashboard";
import { OwnerDashboard } from "./owner-dashboard";

export interface DashboardOverviewClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  overview: DashboardOverview;
}

export function DashboardOverviewClient({
  user,
  overview,
}: DashboardOverviewClientProps) {
  if (user.role === Role.CASHIER) {
    return <CashierDashboard user={user} overview={overview} />;
  }

  if (user.role === Role.MANAGER) {
    return <ManagerDashboard user={user} overview={overview} />;
  }

  return <OwnerDashboard user={user} overview={overview} />;
}
