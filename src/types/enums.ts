/**
 * Client-safe Domain Enums
 *
 * In Next.js with Prisma 7, importing enums directly from `@prisma/client`
 * inside client components ("use client") causes Webpack to bundle
 * `@prisma/client/index-browser.js`, which fails during Vercel builds.
 *
 * These pure JavaScript const objects and TypeScript union types mirror Prisma enums 1:1,
 * providing identical runtime values, full type compatibility, and 100% browser-safety.
 */

export const Role = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  CASHIER: "CASHIER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  NEW: "NEW",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  CASH: "CASH",
  VISA: "VISA",
  ONLINE: "ONLINE",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const DriverType = {
  OWN: "OWN",
  APP: "APP",
  EXTERNAL: "EXTERNAL",
  PICKUP: "PICKUP",
} as const;
export type DriverType = (typeof DriverType)[keyof typeof DriverType];

export const DiscountStatus = {
  NONE: "NONE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type DiscountStatus = (typeof DiscountStatus)[keyof typeof DiscountStatus];

export const CancelReason = {
  CUSTOMER_CHANGED_MIND: "CUSTOMER_CHANGED_MIND",
  DELIVERY_ISSUE: "DELIVERY_ISSUE",
  QUALITY_ISSUE: "QUALITY_ISSUE",
  NO_ANSWER: "NO_ANSWER",
  ITEM_UNAVAILABLE: "ITEM_UNAVAILABLE",
  OTHER: "OTHER",
} as const;
export type CancelReason = (typeof CancelReason)[keyof typeof CancelReason];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  CANCEL: "CANCEL",
  STATUS_CHANGE: "STATUS_CHANGE",
  DISCOUNT_REQUEST: "DISCOUNT_REQUEST",
  DISCOUNT_APPROVE: "DISCOUNT_APPROVE",
  DISCOUNT_REJECT: "DISCOUNT_REJECT",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
