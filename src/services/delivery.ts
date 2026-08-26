import { Prisma, DriverType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

// طبقة خدمات التوصيل (المناطق والمناديب وتعيين المناديب) — Directives §2, §3, §4
// Single source of truth لكافة عمليات إدارة الدليفري مع تسجيل الـ AuditLog ذرّيًا

export interface CreateDeliveryZoneInput {
  name: string;
  fee: number;
}

export interface UpdateDeliveryZoneInput {
  name?: string;
  fee?: number;
  isActive?: boolean;
}

export interface CreateDeliveryDriverInput {
  name: string;
  type: DriverType;
}

export interface UpdateDeliveryDriverInput {
  name?: string;
  type?: DriverType;
  isActive?: boolean;
}

/**
 * جلب قائمة مناطق التوصيل مرتبة أبجديًا
 */
export async function listDeliveryZones(includeInactive = false) {
  return prisma.deliveryZone.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { name: "asc" },
  });
}

/**
 * إنشاء منطقة توصيل جديدة مع تسجيل الـ Audit ذرّيًا
 */
export async function createDeliveryZone(
  userId: string,
  input: CreateDeliveryZoneInput
) {
  const trimmedName = input.name?.trim();
  if (!trimmedName) {
    throw new Error("INVALID_NAME: Zone name is required");
  }

  if (input.fee === undefined || input.fee === null || input.fee < 0 || isNaN(input.fee)) {
    throw new Error("INVALID_FEE: Delivery fee must be greater than or equal to zero");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.deliveryZone.create({
      data: {
        name: trimmedName,
        fee: new Prisma.Decimal(input.fee),
      },
    });

    await audit(tx, {
      userId,
      action: "CREATE",
      entityType: "DeliveryZone",
      entityId: created.id,
      newValue: {
        name: created.name,
        fee: Number(created.fee),
      },
    });

    return created;
  });
}

/**
 * تعديل منطقة توصيل (الاسم، السعر، أو حالة التفعيل) مع تسجيل الـ Audit ذرّيًا
 */
export async function updateDeliveryZone(
  userId: string,
  zoneId: string,
  data: UpdateDeliveryZoneInput
) {
  if (!zoneId || !zoneId.trim()) {
    throw new Error("INVALID_ZONE_ID: Zone ID is required");
  }

  const patch: Prisma.DeliveryZoneUpdateInput = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) {
      throw new Error("INVALID_NAME: Zone name cannot be empty");
    }
    patch.name = trimmed;
  }

  if (data.fee !== undefined) {
    if (data.fee < 0 || isNaN(data.fee)) {
      throw new Error("INVALID_FEE: Delivery fee must be greater than or equal to zero");
    }
    patch.fee = new Prisma.Decimal(data.fee);
  }

  if (data.isActive !== undefined) {
    patch.isActive = data.isActive;
  }

  const before = await prisma.deliveryZone.findUnique({ where: { id: zoneId } });
  if (!before) {
    throw new Error("ZONE_NOT_FOUND: Delivery zone not found");
  }

  return prisma.$transaction(async (tx) => {
    const after = await tx.deliveryZone.update({
      where: { id: zoneId },
      data: patch,
    });

    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "DeliveryZone",
      entityId: zoneId,
      oldValue: {
        name: before.name,
        fee: Number(before.fee),
        isActive: before.isActive,
      },
      newValue: {
        name: after.name,
        fee: Number(after.fee),
        isActive: after.isActive,
      },
    });

    return after;
  });
}

/**
 * جلب قائمة مناديب التوصيل مرتبة أبجديًا مع إمكانية الفلترة حسب النوع أو التفعيل
 */
export async function listDeliveryDrivers(
  includeInactive = false,
  type?: DriverType
) {
  const where: Prisma.DeliveryDriverWhereInput = {};
  if (!includeInactive) {
    where.isActive = true;
  }
  if (type) {
    where.type = type;
  }

  return prisma.deliveryDriver.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

/**
 * إنشاء مندوب جديد مع تسجيل الـ Audit ذرّيًا
 */
export async function createDeliveryDriver(
  userId: string,
  input: CreateDeliveryDriverInput
) {
  const trimmedName = input.name?.trim();
  if (!trimmedName) {
    throw new Error("INVALID_NAME: Driver name is required");
  }

  if (!input.type || !Object.values(DriverType).includes(input.type)) {
    throw new Error("INVALID_DRIVER_TYPE: Invalid driver type");
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.deliveryDriver.create({
      data: {
        name: trimmedName,
        type: input.type,
      },
    });

    await audit(tx, {
      userId,
      action: "CREATE",
      entityType: "DeliveryDriver",
      entityId: created.id,
      newValue: {
        name: created.name,
        type: created.type,
      },
    });

    return created;
  });
}

/**
 * تعديل بيانات مندوب (الاسم، النوع، أو حالة التفعيل) مع تسجيل الـ Audit ذرّيًا
 */
export async function updateDeliveryDriver(
  userId: string,
  driverId: string,
  data: UpdateDeliveryDriverInput
) {
  if (!driverId || !driverId.trim()) {
    throw new Error("INVALID_DRIVER_ID: Driver ID is required");
  }

  const patch: Prisma.DeliveryDriverUpdateInput = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) {
      throw new Error("INVALID_NAME: Driver name cannot be empty");
    }
    patch.name = trimmed;
  }

  if (data.type !== undefined) {
    if (!Object.values(DriverType).includes(data.type)) {
      throw new Error("INVALID_DRIVER_TYPE: Invalid driver type");
    }
    patch.type = data.type;
  }

  if (data.isActive !== undefined) {
    patch.isActive = data.isActive;
  }

  const before = await prisma.deliveryDriver.findUnique({ where: { id: driverId } });
  if (!before) {
    throw new Error("DRIVER_NOT_FOUND: Delivery driver not found");
  }

  return prisma.$transaction(async (tx) => {
    const after = await tx.deliveryDriver.update({
      where: { id: driverId },
      data: patch,
    });

    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "DeliveryDriver",
      entityId: driverId,
      oldValue: {
        name: before.name,
        type: before.type,
        isActive: before.isActive,
      },
      newValue: {
        name: after.name,
        type: after.type,
        isActive: after.isActive,
      },
    });

    return after;
  });
}

/**
 * تعيين مندوب للأوردر مع إعادة احتساب رسوم التوصيل تلقائيًا وتسجيل الـ Audit ذرّيًا
 * - إذا كان المندوب APP أو PICKUP: تصفر رسوم التوصيل المحصلة للمطعم (0).
 * - إذا كان المندوب OWN أو EXTERNAL: تعاد رسوم التوصيل لقيمة رسوم المنطقة إذا كان للأوردر منطقة محددة.
 */
export async function assignDriverToOrder(
  userId: string,
  orderId: string,
  driverId: string
) {
  if (!orderId || !orderId.trim()) {
    throw new Error("INVALID_ORDER_ID: Order ID is required");
  }
  if (!driverId || !driverId.trim()) {
    throw new Error("INVALID_DRIVER_ID: Driver ID is required");
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { zone: true },
    });
    if (!order) {
      throw new Error("ORDER_NOT_FOUND: Order not found");
    }

    const driver = await tx.deliveryDriver.findUnique({
      where: { id: driverId },
    });
    if (!driver) {
      throw new Error("DRIVER_NOT_FOUND: Driver not found");
    }
    if (!driver.isActive) {
      throw new Error("DRIVER_INACTIVE: Cannot assign inactive driver");
    }

    // Business rule: If driver is APP or PICKUP, net deliveryFee is 0.
    // If OWN or EXTERNAL, restores zone fee if order has zone.
    let newDeliveryFee = 0;
    if (driver.type === DriverType.APP || driver.type === DriverType.PICKUP) {
      newDeliveryFee = 0;
    } else if (order.zone) {
      newDeliveryFee = Number(order.zone.fee);
    } else {
      newDeliveryFee = 0;
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        driverId: driver.id,
        deliveryFee: new Prisma.Decimal(newDeliveryFee),
      },
      include: {
        driver: true,
        zone: true,
        platform: true,
        brand: true,
        customer: true,
        items: { include: { product: true } },
      },
    });

    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "Order",
      entityId: orderId,
      oldValue: {
        driverId: order.driverId,
        deliveryFee: Number(order.deliveryFee),
      },
      newValue: {
        driverId: driver.id,
        driverType: driver.type,
        deliveryFee: newDeliveryFee,
      },
    });

    return updatedOrder;
  });
}
