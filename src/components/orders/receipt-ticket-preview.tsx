"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Printer, Check, Receipt, Banknote, CreditCard, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getBrandToken, getPlatformToken, getLoyaltyTier } from "@/lib/visualTokens";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { LoyaltyTierBadge } from "@/components/ui/loyalty-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ReceiptItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ReceiptCustomerInfo {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  totalOrders?: number | null;
}

export interface ReceiptTicketPreviewProps {
  brandName?: string | null;
  platformName?: string | null;
  externalId?: string | null;
  orderNumber?: string | null;
  createdAt?: Date | string | null;
  cashierName?: string | null;
  customer?: ReceiptCustomerInfo | null;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  discountReason?: string | null;
  deliveryFee?: number;
  zoneName?: string | null;
  driverName?: string | null;
  grandTotal: number;
  paymentMethod?: string | null;
  notes?: string | null;
  className?: string;
  showActions?: boolean;
  onPrint?: () => void;
  onCopy?: () => void;
}

export function ReceiptTicketPreview({
  brandName,
  platformName,
  externalId,
  orderNumber,
  createdAt,
  cashierName,
  customer,
  items = [],
  subtotal = 0,
  discount = 0,
  discountReason,
  deliveryFee = 0,
  zoneName,
  driverName,
  grandTotal = 0,
  paymentMethod = "CASH",
  notes,
  className,
  showActions = true,
  onPrint,
  onCopy,
}: ReceiptTicketPreviewProps) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const [copied, setCopied] = React.useState(false);

  const brandToken = getBrandToken(brandName);
  const platformToken = getPlatformToken(platformName);
  const customerLoyalty = getLoyaltyTier(customer?.totalOrders);

  const orderTimeStr = React.useMemo(() => {
    const d = createdAt ? new Date(createdAt) : new Date();
    return d.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [createdAt, locale]);

  const rawDateStr = React.useMemo(() => {
    const d = createdAt ? new Date(createdAt) : new Date();
    return d.toISOString().replace("T", " ").substring(0, 16);
  }, [createdAt]);

  // ────────────────────────── Copy Text Receipt ──────────────────────────
  const handleCopyText = React.useCallback(() => {
    if (onCopy) {
      onCopy();
      return;
    }

    const brandDisplay = `${brandToken.name} (${brandToken.kanji})`;
    const platformDisplay = platformToken.name;
    const orderNumDisplay = orderNumber || "PREVIEW-POS";
    const cur = t("currency");

    const lines: string[] = [];
    lines.push("========================================");
    lines.push(`       ${brandDisplay.toUpperCase()}`);
    lines.push(`      ${platformDisplay.toUpperCase()} ORDER #${orderNumDisplay}`);
    lines.push("----------------------------------------");
    lines.push(`Date: ${rawDateStr}`);
    if (cashierName) lines.push(`Cashier: ${cashierName}`);
    if (externalId) lines.push(`Ext ID: ${externalId}`);
    lines.push("----------------------------------------");

    if (customer?.name || customer?.phone) {
      lines.push("CUSTOMER INFO:");
      if (customer.name) lines.push(`Name: ${customer.name}`);
      if (customer.phone) lines.push(`Phone: ${customer.phone}`);
      if (customerLoyalty.tier !== "new") {
        lines.push(`Tier: ${locale === "ar" ? customerLoyalty.labelAr : customerLoyalty.labelEn} (${customer?.totalOrders || 0} orders)`);
      }
      if (customer.address) lines.push(`Address: ${customer.address}`);
      if (zoneName) lines.push(`Zone: ${zoneName}`);
      if (driverName) lines.push(`Driver: ${driverName}`);
      lines.push("----------------------------------------");
    }

    lines.push("ITEMS:");
    if (items.length === 0) {
      lines.push("  (No items)");
    } else {
      items.forEach((item) => {
        const itemTot = (item.price * item.quantity).toFixed(2);
        lines.push(`  ${item.quantity}x ${item.name}`);
        lines.push(`     @ ${item.price.toFixed(2)} ${cur} = ${itemTot} ${cur}`);
      });
    }

    lines.push("----------------------------------------");
    lines.push(`Subtotal:      ${subtotal.toFixed(2)} ${cur}`);
    if (deliveryFee > 0) {
      lines.push(`Delivery Fee:  +${deliveryFee.toFixed(2)} ${cur}`);
    }
    if (discount > 0) {
      const reasonStr = discountReason ? ` (${discountReason})` : "";
      lines.push(`Discount:      -${discount.toFixed(2)} ${cur}${reasonStr}`);
    }
    lines.push("========================================");
    lines.push(`TOTAL:         ${grandTotal.toFixed(2)} ${cur}`);
    lines.push(`Payment:       ${paymentMethod || "CASH"}`);
    if (notes) {
      lines.push(`Notes:         ${notes}`);
    }
    lines.push("========================================");
    lines.push("      毎度ありがとうございます");
    lines.push("    Thank you for dining with us! 🍣");
    lines.push("========================================");

    const fullText = lines.join("\n");
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      toast.success(t("receipt.receiptCopied"));
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Failed to copy receipt");
    });
  }, [
    onCopy,
    brandToken,
    platformToken,
    orderNumber,
    rawDateStr,
    cashierName,
    externalId,
    customer,
    customerLoyalty,
    locale,
    zoneName,
    driverName,
    items,
    subtotal,
    deliveryFee,
    discount,
    discountReason,
    grandTotal,
    paymentMethod,
    notes,
    t,
  ]);

  // ────────────────────────── Print Receipt ──────────────────────────
  const handlePrint = React.useCallback(() => {
    if (onPrint) {
      onPrint();
      return;
    }

    const printContent = document.getElementById("thermal-pos-ticket-node");
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open("", "_blank", "width=420,height=750");
    if (!printWindow) {
      window.print();
      return;
    }

    const isRtl = locale === "ar";
    const cur = t("currency");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRtl ? "rtl" : "ltr"}">
      <head>
        <meta charset="utf-8" />
        <title>POS Receipt - ${orderNumber || "Preview"}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', Courier, monospace, 'Segoe UI', Tahoma, sans-serif;
            font-size: 11px;
            line-height: 1.35;
            margin: 0;
            padding: 8px 12px;
            color: #000;
            background: #fff;
            width: 80mm;
            max-width: 80mm;
          }
          .header {
            text-align: center;
            margin-bottom: 6px;
          }
          .kanji {
            font-size: 20px;
            font-weight: 900;
            line-height: 1;
            margin-bottom: 2px;
          }
          .brand-name {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 9px;
            color: #333;
            margin-top: 1px;
          }
          .divider-dashed {
            border-bottom: 1px dashed #000;
            margin: 5px 0;
          }
          .divider-double {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            margin: 6px 0;
            padding: 4px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2px;
          }
          .bold {
            font-weight: bold;
          }
          .mono {
            font-family: monospace;
            font-variant-numeric: tabular-nums;
          }
          .items-table {
            width: 100%;
            margin: 4px 0;
          }
          .item-row {
            margin-bottom: 4px;
          }
          .total-box {
            font-size: 14px;
            font-weight: 900;
            display: flex;
            justify-content: space-between;
          }
          .footer {
            text-align: center;
            margin-top: 8px;
            font-size: 9px;
          }
          .barcode {
            height: 24px;
            margin: 6px auto;
            background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 7px, #fff 7px, #fff 9px);
            width: 70%;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="kanji">${brandToken.kanji}</div>
          <div class="brand-name">${brandToken.name}</div>
          <div class="subtitle">SUSHI CLOUD KITCHEN · ${platformToken.name}</div>
          <div class="mono bold" style="margin-top:3px;">#${orderNumber || "PREVIEW"}</div>
        </div>

        <div class="divider-dashed"></div>

        <div class="row">
          <span>${t("receipt.dateTime")}:</span>
          <span class="mono">${orderTimeStr}</span>
        </div>
        ${externalId ? `<div class="row"><span>${t("externalId")}:</span><span class="mono">${externalId}</span></div>` : ""}
        ${cashierName ? `<div class="row"><span>${t("receipt.cashier")}:</span><span>${cashierName}</span></div>` : ""}

        ${customer?.name || customer?.phone ? `
          <div class="divider-dashed"></div>
          <div class="bold">${t("customer")}:</div>
          ${customer.name ? `<div class="row"><span>${t("customerName")}:</span><span>${customer.name}</span></div>` : ""}
          ${customer.phone ? `<div class="row"><span>${t("phone")}:</span><span class="mono" dir="ltr">${customer.phone}</span></div>` : ""}
          ${customer.address ? `<div class="row"><span>${t("customerAddress")}:</span><span>${customer.address}</span></div>` : ""}
          ${zoneName ? `<div class="row"><span>${t("deliveryZone")}:</span><span>${zoneName}</span></div>` : ""}
        ` : ""}

        <div class="divider-dashed"></div>
        <div class="bold" style="margin-bottom:3px;">${t("cart")}:</div>

        <div class="items-table">
          ${items.length === 0 ? `<div>(No items)</div>` : items.map((i) => `
            <div class="item-row">
              <div class="row bold">
                <span>${i.quantity}x ${i.name}</span>
                <span class="mono">${(i.price * i.quantity).toFixed(2)} ${cur}</span>
              </div>
              <div class="mono" style="font-size:9px; color:#555; padding-inline-start:12px;">
                @ ${i.price.toFixed(2)} ${cur}
              </div>
            </div>
          `).join("")}
        </div>

        <div class="divider-dashed"></div>

        <div class="row">
          <span>${t("subtotal")}:</span>
          <span class="mono">${subtotal.toFixed(2)} ${cur}</span>
        </div>
        ${deliveryFee > 0 ? `
          <div class="row">
            <span>${t("deliveryFee")}:</span>
            <span class="mono">+${deliveryFee.toFixed(2)} ${cur}</span>
          </div>
        ` : ""}
        ${discount > 0 ? `
          <div class="row bold">
            <span>${t("discount")} ${discountReason ? `(${discountReason})` : ""}:</span>
            <span class="mono">-${discount.toFixed(2)} ${cur}</span>
          </div>
        ` : ""}

        <div class="divider-double">
          <div class="total-box">
            <span>${t("total")}:</span>
            <span class="mono">${grandTotal.toFixed(2)} ${cur}</span>
          </div>
        </div>

        <div class="row bold">
          <span>${t("paymentMethod")}:</span>
          <span>${paymentMethod || "CASH"}</span>
        </div>

        ${notes ? `
          <div class="divider-dashed"></div>
          <div><span class="bold">${t("orderNotes")}:</span> ${notes}</div>
        ` : ""}

        <div class="footer">
          <div class="barcode"></div>
          <div>毎度ありがとうございます</div>
          <div>${t("receipt.thankYouAr")}</div>
          <div style="font-size:8px; margin-top:2px;">*** ORDER CONTROL SYSTEM ***</div>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, [
    onPrint,
    locale,
    orderNumber,
    brandToken,
    platformToken,
    orderTimeStr,
    externalId,
    cashierName,
    customer,
    zoneName,
    items,
    subtotal,
    deliveryFee,
    discount,
    discountReason,
    grandTotal,
    paymentMethod,
    notes,
    t,
  ]);

  const paymentIcon = React.useMemo(() => {
    switch (paymentMethod) {
      case "VISA":
        return <CreditCard className="size-3.5 text-blue-500" />;
      case "ONLINE":
        return <Globe className="size-3.5 text-purple-500" />;
      case "CASH":
      default:
        return <Banknote className="size-3.5 text-emerald-500" />;
    }
  }, [paymentMethod]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* ────────────────────────── Toolbar Controls ────────────────────────── */}
      {showActions && (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-card/80 p-2.5 shadow-xs backdrop-blur-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Receipt className="size-4 text-primary" />
            <span>{t("receipt.thermalReceipt")}</span>
            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
              POS 80mm
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="h-8 text-xs font-medium gap-1 cursor-pointer"
              title={t("receipt.copyReceipt")}
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              <span className="hidden sm:inline">{t("receipt.copyReceipt")}</span>
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs font-medium gap-1 shadow-xs cursor-pointer"
              title={t("receipt.printReceipt")}
            >
              <Printer className="size-3.5" />
              <span>{t("receipt.printReceipt")}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────── Thermal Ticket Simulation ────────────────────────── */}
      <div
        id="thermal-pos-ticket-node"
        data-slot="receipt-ticket"
        className="relative mx-auto w-full max-w-[380px] select-text overflow-hidden rounded-md bg-[#fefefe] dark:bg-[#141416] text-zinc-900 dark:text-zinc-100 shadow-xl border border-zinc-200/80 dark:border-zinc-800 transition-all font-mono"
      >
        {/* Jagged Perforated Top Edge SVG */}
        <div className="w-full flex overflow-hidden leading-none text-zinc-200 dark:text-zinc-800 -mb-[1px]">
          <svg className="w-full h-2.5" preserveAspectRatio="none" viewBox="0 0 120 8" fill="currentColor">
            <polygon points="0,8 3,0 6,8 9,0 12,8 15,0 18,8 21,0 24,8 27,0 30,8 33,0 36,8 39,0 42,8 45,0 48,8 51,0 54,8 57,0 60,8 63,0 66,8 69,0 72,8 75,0 78,8 81,0 84,8 87,0 90,8 93,0 96,8 99,0 102,8 105,0 108,8 111,0 114,8 117,0 120,8" />
          </svg>
        </div>

        <div className="p-4 sm:p-5 text-xs space-y-3">
          {/* Header & Brand Identity */}
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="flex items-center justify-center size-10 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 shadow-inner">
              <span className="text-xl font-black leading-none text-zinc-800 dark:text-zinc-100">
                {brandToken.kanji}
              </span>
            </div>

            <div className="font-extrabold text-sm tracking-wide text-zinc-900 dark:text-zinc-50">
              {brandToken.name}
            </div>

            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans font-medium flex items-center gap-1">
              <Sparkles className="size-2.5 text-amber-500" />
              <span>SUSHI CLOUD KITCHEN LAB</span>
              <Sparkles className="size-2.5 text-amber-500" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <PlatformBadge platformName={platformToken.name} size="sm" variant="subtle" />
              <span className="font-bold text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700 tabular-nums">
                #{orderNumber || "PREVIEW-POS"}
              </span>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 my-1" />

          {/* Metadata Rows */}
          <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">{t("receipt.dateTime")}:</span>
              <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">{orderTimeStr}</span>
            </div>

            {externalId && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">{t("externalId")}:</span>
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{externalId}</span>
              </div>
            )}

            {cashierName && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">{t("receipt.cashier")}:</span>
                <span className="text-zinc-800 dark:text-zinc-200">{cashierName}</span>
              </div>
            )}
          </div>

          {/* Customer & Loyalty Block */}
          {(customer?.name || customer?.phone) && (
            <>
              <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 my-1" />
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {customer.name || t("customer")}
                  </span>
                  <LoyaltyTierBadge
                    totalOrders={customer.totalOrders}
                    size="sm"
                    showOrderCount={Boolean(customer.totalOrders && customer.totalOrders > 0)}
                  />
                </div>

                {customer.phone && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                    <span className="text-zinc-500 dark:text-zinc-400">{t("phone")}:</span>
                    <span className="font-mono tabular-nums font-medium" dir="ltr">
                      {customer.phone}
                    </span>
                  </div>
                )}

                {customer.address && (
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-300 bg-zinc-100/70 dark:bg-zinc-800/50 p-1.5 rounded-sm border border-zinc-200/50 dark:border-zinc-700/50 leading-tight">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">{t("customerAddress")}: </span>
                    {customer.address}
                  </div>
                )}

                {(zoneName || driverName) && (
                  <div className="flex flex-wrap gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                    {zoneName && (
                      <span>
                        <strong className="text-zinc-700 dark:text-zinc-300">{t("deliveryZone")}:</strong> {zoneName}
                      </span>
                    )}
                    {driverName && (
                      <span>
                        <strong className="text-zinc-700 dark:text-zinc-300">{t("driver")}:</strong> {driverName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Perforated Divider */}
          <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 my-1" />

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-1">
              <span>{t("receipt.item")}</span>
              <span>{t("receipt.amount")}</span>
            </div>

            {items.length === 0 ? (
              <div className="py-4 text-center text-zinc-400 dark:text-zinc-500 italic text-[11px]">
                {t("receipt.emptyReceiptNotice")}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div key={`${item.productId || item.name}-${idx}`} className="text-[11px] leading-tight space-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          <span className="font-bold text-primary font-mono me-1">{item.quantity}x</span>
                          {item.name}
                        </span>
                        <span className="font-mono tabular-nums font-bold text-zinc-900 dark:text-zinc-100 shrink-0" dir="ltr">
                          {lineTotal.toFixed(2)} {t("currency")}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums ps-4" dir="ltr">
                        @ {item.price.toFixed(2)} {t("currency")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Perforated Divider */}
          <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700 my-1" />

          {/* Financial Breakdown */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
              <span>{t("subtotal")}</span>
              <span className="font-mono tabular-nums font-medium" dir="ltr">
                {subtotal.toFixed(2)} {t("currency")}
              </span>
            </div>

            {deliveryFee > 0 && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
                <span>{t("deliveryFee")}</span>
                <span className="font-mono tabular-nums font-medium" dir="ltr">
                  +{deliveryFee.toFixed(2)} {t("currency")}
                </span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="truncate">
                  {t("discount")} {discountReason ? `(${discountReason})` : ""}
                </span>
                <span className="font-mono tabular-nums font-semibold shrink-0" dir="ltr">
                  -{discount.toFixed(2)} {t("currency")}
                </span>
              </div>
            )}

            {/* Double Border Highlight for Grand Total */}
            <div className="border-y-2 border-zinc-800 dark:border-zinc-200 py-1.5 my-2">
              <div className="flex items-center justify-between text-sm font-black text-zinc-950 dark:text-zinc-50">
                <span className="uppercase tracking-wider">{t("total")}</span>
                <span className="text-base font-extrabold font-mono tabular-nums" dir="ltr">
                  {grandTotal.toFixed(2)} {t("currency")}
                </span>
              </div>
            </div>

            {/* Payment Method Badge Indicator */}
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-zinc-500 dark:text-zinc-400">{t("paymentMethod")}:</span>
              <div className="flex items-center gap-1.5 font-bold text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-sm border border-zinc-200 dark:border-zinc-700">
                {paymentIcon}
                <span>{t(`paymentMethods.${paymentMethod || "CASH"}`)}</span>
              </div>
            </div>

            {notes && (
              <div className="pt-2 text-[10px] text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/80 p-1.5 rounded-sm border border-zinc-200/60 dark:border-zinc-800">
                <strong className="not-italic text-zinc-700 dark:text-zinc-300">{t("orderNotes")}: </strong>
                {notes}
              </div>
            )}
          </div>

          {/* Footer & Barcode Simulation */}
          <div className="pt-2 flex flex-col items-center text-center space-y-1.5 border-t border-dashed border-zinc-300 dark:border-zinc-700">
            {/* Barcode Lines Simulation */}
            <div className="h-6 w-48 bg-repeat-x flex items-center justify-center overflow-hidden opacity-80 my-0.5">
              <div className="w-full h-full flex items-center justify-between gap-[2px]">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-full bg-zinc-800 dark:bg-zinc-200",
                      i % 3 === 0 ? "w-1" : i % 5 === 0 ? "w-1.5" : "w-[1px]"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="text-[10px] font-bold tracking-widest text-zinc-700 dark:text-zinc-300">
              毎度ありがとうございます
            </div>

            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans">
              {t("receipt.thankYouAr")}
            </div>

            <div className="text-[8px] text-zinc-400 dark:text-zinc-500 font-mono">
              *** ORDER CONTROL SYSTEM · POS TICKET ***
            </div>
          </div>
        </div>

        {/* Jagged Perforated Bottom Edge SVG */}
        <div className="w-full flex overflow-hidden leading-none text-zinc-200 dark:text-zinc-800 -mt-[1px]">
          <svg className="w-full h-2.5 rotate-180" preserveAspectRatio="none" viewBox="0 0 120 8" fill="currentColor">
            <polygon points="0,8 3,0 6,8 9,0 12,8 15,0 18,8 21,0 24,8 27,0 30,8 33,0 36,8 39,0 42,8 45,0 48,8 51,0 54,8 57,0 60,8 63,0 66,8 69,0 72,8 75,0 78,8 81,0 84,8 87,0 90,8 93,0 96,8 99,0 102,8 105,0 108,8 111,0 114,8 117,0 120,8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
