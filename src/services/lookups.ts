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

export const STANDARD_PLATFORMS = [
  "Talabat",
  "InstaShop",
  "Harry App",
  "Elmenus",
  "Facebook",
  "Phone",
] as const;

export async function listPlatforms(): Promise<PlatformLookup[]> {
  // Ensure all 6 standard platforms exist and are active
  for (const name of STANDARD_PLATFORMS) {
    const existing = await prisma.platform.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: "insensitive" } },
          { name: { equals: name.replace(/\s+/g, ""), mode: "insensitive" } },
        ],
      },
    });
    if (!existing) {
      await prisma.platform.create({
        data: { name, isActive: true },
      });
    } else if (!existing.isActive) {
      await prisma.platform.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
  }

  // Deactivate any platform that is not one of the 6 standard platforms
  const allPlatforms = await prisma.platform.findMany();
  for (const p of allPlatforms) {
    const isStandard = STANDARD_PLATFORMS.some(
      (s) =>
        s.toLowerCase() === p.name.toLowerCase() ||
        s.toLowerCase().replace(/\s+/g, "") === p.name.toLowerCase().replace(/\s+/g, "")
    );
    if (!isStandard && p.isActive) {
      await prisma.platform.update({
        where: { id: p.id },
        data: { isActive: false },
      });
    }
  }

  return prisma.platform.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isActive: true },
  });
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
