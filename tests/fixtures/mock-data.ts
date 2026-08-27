/**
 * Mock Data Fixtures for E2E Tests across All 13 Features
 */

export interface MockOrder {
  id: string;
  orderNumber: string;
  brandName: string;
  platformName: string;
  status: "NEW" | "CONFIRMED" | "PREPARING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  customer: {
    name: string;
    phone: string;
    address: string;
    totalOrders: number;
  };
  paymentMethod: "CASH" | "VISA" | "ONLINE";
  driverType?: "OWN" | "APP" | "EXTERNAL" | "PICKUP" | null;
  driverName?: string | null;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  confirmedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

export const MOCK_BRANDS = [
  { id: "b-flower", name: "Flower", slug: "flower", kanji: "花", color: "#f472b6" },
  { id: "b-mastery", name: "Mastery", slug: "mastery", kanji: "匠", color: "#eab308" },
  { id: "b-niwa", name: "Niwa", slug: "niwa", kanji: "庭", color: "#10b981" },
  { id: "b-tobiko", name: "Tobiko", slug: "tobiko", kanji: "魚子", color: "#f97316" },
];

export const MOCK_PLATFORMS = [
  { id: "p-talabat", name: "Talabat", color: "#ff5a00" },
  { id: "p-elmenus", name: "elmenus", color: "#e21b1b" },
  { id: "p-instashop", name: "InstaShop", color: "#00a699" },
  { id: "p-harryapp", name: "HarryApp", color: "#4f46e5" },
  { id: "p-facebook", name: "Facebook", color: "#1877f2" },
  { id: "p-phone", name: "Phone", color: "#0284c7" },
];

export const MOCK_PRODUCTS = [
  { id: "prod-1", name: "Salmon Philadelphia Roll", brand: "Flower", price: 180 },
  { id: "prod-2", name: "Crispy Shrimp Dynamite Roll", brand: "Mastery", price: 195 },
  { id: "prod-3", name: "Matcha Smoked Eel Roll", brand: "Niwa", price: 220 },
  { id: "prod-4", name: "Spicy Tobiko Gunkan (4pcs)", brand: "Tobiko", price: 150 },
  { id: "prod-5", name: "Dragon Roll Special", brand: "Mastery", price: 210 },
  { id: "prod-6", name: "Salmon Sashimi Platter", brand: "Flower", price: 340 },
];

export const MOCK_CUSTOMERS = [
  { name: "أحمد علي", phone: "01011112222", address: "المعادي، شارع 9", totalOrders: 0 },    // New Guest
  { name: "سارة محمد", phone: "01033334444", address: "الزمالك، ش البرازيل", totalOrders: 3 },  // Regular
  { name: "محمود حسن", phone: "01055556666", address: "الدقي، ش مصدق", totalOrders: 12 },    // Gold VIP
  { name: "كريم يوسف", phone: "01077778888", address: "التجمع الخامس", totalOrders: 35 },     // Platinum Legend
];

export const MOCK_ORDERS_DATASET: MockOrder[] = [
  {
    id: "ord-101",
    orderNumber: "ORD-2026-001",
    brandName: "Flower",
    platformName: "Talabat",
    status: "NEW",
    customer: MOCK_CUSTOMERS[0],
    paymentMethod: "ONLINE",
    driverType: "APP",
    items: [{ productId: "prod-1", name: "Salmon Philadelphia Roll", price: 180, quantity: 2 }],
    subtotal: 360,
    discount: 0,
    deliveryFee: 35,
    total: 360, // APP driver = 0 delivery fee to restaurant
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-102",
    orderNumber: "ORD-2026-002",
    brandName: "Mastery",
    platformName: "elmenus",
    status: "PREPARING",
    customer: MOCK_CUSTOMERS[1],
    paymentMethod: "VISA",
    driverType: "OWN",
    driverName: "كابتن طارق",
    items: [{ productId: "prod-2", name: "Crispy Shrimp Dynamite Roll", price: 195, quantity: 1 }],
    subtotal: 195,
    discount: 20,
    deliveryFee: 30,
    total: 205, // 195 - 20 + 30
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins in prep (Normal)
  },
  {
    id: "ord-103",
    orderNumber: "ORD-2026-003",
    brandName: "Niwa",
    platformName: "InstaShop",
    status: "PREPARING",
    customer: MOCK_CUSTOMERS[2],
    paymentMethod: "CASH",
    driverType: "OWN",
    items: [{ productId: "prod-3", name: "Matcha Smoked Eel Roll", price: 220, quantity: 2 }],
    subtotal: 440,
    discount: 50,
    deliveryFee: 25,
    total: 415,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 mins in prep (CRITICAL >15m)
  },
  {
    id: "ord-104",
    orderNumber: "ORD-2026-004",
    brandName: "Tobiko",
    platformName: "Phone",
    status: "READY",
    customer: MOCK_CUSTOMERS[3],
    paymentMethod: "CASH",
    driverType: "OWN",
    driverName: "كابتن سمير",
    items: [{ productId: "prod-4", name: "Spicy Tobiko Gunkan (4pcs)", price: 150, quantity: 3 }],
    subtotal: 450,
    discount: 100,
    deliveryFee: 30,
    total: 380,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-105",
    orderNumber: "ORD-2026-005",
    brandName: "Flower",
    platformName: "HarryApp",
    status: "OUT_FOR_DELIVERY",
    customer: MOCK_CUSTOMERS[1],
    paymentMethod: "VISA",
    driverType: "EXTERNAL",
    driverName: "مندوب خارجي",
    items: [{ productId: "prod-6", name: "Salmon Sashimi Platter", price: 340, quantity: 1 }],
    subtotal: 340,
    discount: 0,
    deliveryFee: 40,
    total: 380,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    outForDeliveryAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "ord-106",
    orderNumber: "ORD-2026-006",
    brandName: "Mastery",
    platformName: "Talabat",
    status: "DELIVERED",
    customer: MOCK_CUSTOMERS[2],
    paymentMethod: "ONLINE",
    driverType: "APP",
    items: [{ productId: "prod-5", name: "Dragon Roll Special", price: 210, quantity: 2 }],
    subtotal: 420,
    discount: 0,
    deliveryFee: 30,
    total: 420,
    createdAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    preparingAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    outForDeliveryAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];
