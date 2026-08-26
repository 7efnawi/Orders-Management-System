import { prisma } from "@/lib/prisma";

export interface PlatformLookup {
  id: string;
  name: string;
  isActive: boolean;
}

export interface DeliveryZoneLookup {
  id: string;
  name: string;
  fee: number;
  isActive: boolean;
}

export interface DeliveryDriverLookup {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export async function listPlatforms(): Promise<PlatformLookup[]> {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isActive: true },
  });

  if (platforms.length === 0) {
    const defaultNames = ["Phone", "Talabat", "elmenus", "InstaShop", "HarryApp"];
    await prisma.platform.createMany({
      data: defaultNames.map((name) => ({ name })),
      skipDuplicates: true,
    });
    return prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, isActive: true },
    });
  }

  return platforms;
}

export async function listDeliveryZones(): Promise<DeliveryZoneLookup[]> {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, fee: true, isActive: true },
  });

  return zones.map((z) => ({
    id: z.id,
    name: z.name,
    fee: Number(z.fee),
    isActive: z.isActive,
  }));
}

export async function listDeliveryDrivers(): Promise<DeliveryDriverLookup[]> {
  return prisma.deliveryDriver.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, type: true, isActive: true },
  });
}
