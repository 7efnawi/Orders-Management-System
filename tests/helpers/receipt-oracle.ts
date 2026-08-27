/**
 * Authoritative Oracle for POS Receipt Ticket Preview & Tabular Numbers
 * Reference: PROJECT.md § Fast POS Order Creation Screen & ORIGINAL_REQUEST.md § R3
 */

export interface ReceiptItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ReceiptPreviewData {
  brandName: string;
  brandKanji: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  netDeliveryFee: number;
  grandTotal: number;
  currency: string;
  formattedLines: string[];
}

export function generateReceiptPreview(input: {
  brandName: string;
  brandKanji?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: string;
  items: ReceiptItemInput[];
  discount?: number;
  deliveryFee?: number;
  driverType?: string;
  currency?: string;
}): ReceiptPreviewData {
  const currency = input.currency || "EGP";
  const brandKanji = input.brandKanji || "鮨";
  const discount = Math.max(0, input.discount || 0);
  const rawFee = Math.max(0, input.deliveryFee || 0);

  // Delivery fee zeroed if APP driver or customer PICKUP
  const netDeliveryFee =
    input.driverType === "APP" || input.driverType === "PICKUP" ? 0 : rawFee;

  let subtotal = 0;
  const processedItems = input.items.map((item) => {
    const qty = Math.max(0, item.quantity);
    const unitPrice = Math.max(0, item.price);
    const lineTotal = Math.round(qty * unitPrice * 100) / 100;
    subtotal += lineTotal;
    return {
      name: item.name,
      quantity: qty,
      price: unitPrice,
      lineTotal,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal - discount + netDeliveryFee) * 100) / 100);

  // Generate ASCII thermal receipt simulation with aligned columns
  const lines: string[] = [];
  lines.push("========================================");
  lines.push(`       ${brandKanji} ${input.brandName.toUpperCase()}       `);
  lines.push("          DARK KITCHEN POS              ");
  lines.push("========================================");
  if (input.orderNumber) {
    lines.push(`Order #: ${input.orderNumber}`);
  }
  if (input.customerName) {
    lines.push(`Customer: ${input.customerName} (${input.customerPhone || "N/A"})`);
  }
  lines.push(`Payment: ${input.paymentMethod}`);
  lines.push("----------------------------------------");
  lines.push("QTY  ITEM                     PRICE  TOTAL");
  lines.push("----------------------------------------");

  for (const it of processedItems) {
    const qtyStr = String(it.quantity).padEnd(4, " ");
    const nameStr = (it.name.length > 20 ? it.name.substring(0, 17) + "..." : it.name).padEnd(21, " ");
    const priceStr = it.price.toFixed(2).padStart(6, " ");
    const totalStr = it.lineTotal.toFixed(2).padStart(7, " ");
    lines.push(`${qtyStr}${nameStr} ${priceStr} ${totalStr}`);
  }

  lines.push("----------------------------------------");
  lines.push(`SUBTOTAL:            ${subtotal.toFixed(2).padStart(12, " ")} ${currency}`);
  if (discount > 0) {
    lines.push(`DISCOUNT:           -${discount.toFixed(2).padStart(12, " ")} ${currency}`);
  }
  lines.push(`DELIVERY FEE:        ${netDeliveryFee.toFixed(2).padStart(12, " ")} ${currency}`);
  lines.push("========================================");
  lines.push(`GRAND TOTAL:         ${grandTotal.toFixed(2).padStart(12, " ")} ${currency}`);
  lines.push("========================================");
  lines.push("       ARIGATO GOZAIMASU! 🍣           ");

  return {
    brandName: input.brandName,
    brandKanji,
    orderNumber: input.orderNumber,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    paymentMethod: input.paymentMethod,
    items: processedItems,
    subtotal,
    discount,
    deliveryFee: rawFee,
    netDeliveryFee,
    grandTotal,
    currency,
    formattedLines: lines,
  };
}
