import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Tx = Prisma.TransactionClient | typeof prisma;

export interface CustomerInput {
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
}

/**
 * Finds existing customer by unique phone or creates a new one.
 * If customer exists and new address/name/notes are supplied, updates them.
 */
export async function findOrCreateCustomer(tx: Tx, input: CustomerInput) {
  const cleanPhone = input.phone.trim();
  const cleanName = input.name.trim();

  const existing = await tx.customer.findUnique({
    where: { phone: cleanPhone },
  });

  if (existing) {
    const shouldUpdateAddress = input.address !== undefined && input.address !== null && input.address.trim() !== (existing.address ?? "");
    const shouldUpdateNotes = input.notes !== undefined && input.notes !== null && input.notes.trim() !== (existing.notes ?? "");
    const shouldUpdateName = cleanName.length > 0 && cleanName !== existing.name;

    if (shouldUpdateAddress || shouldUpdateNotes || shouldUpdateName) {
      return tx.customer.update({
        where: { id: existing.id },
        data: {
          ...(shouldUpdateName ? { name: cleanName } : {}),
          ...(shouldUpdateAddress ? { address: input.address?.trim() || null } : {}),
          ...(shouldUpdateNotes ? { notes: input.notes?.trim() || null } : {}),
          lastOrderAt: new Date(),
        },
      });
    }
    return existing;
  }

  return tx.customer.create({
    data: {
      name: cleanName,
      phone: cleanPhone,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      lastOrderAt: new Date(),
    },
  });
}

/**
 * Searches customers by phone prefix (returns up to 10 recent matching records).
 */
export async function searchCustomersByPhone(prefix: string) {
  if (!prefix || prefix.trim().length < 3) return [];
  return prisma.customer.findMany({
    where: { phone: { startsWith: prefix.trim() } },
    take: 10,
    orderBy: { lastOrderAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      totalOrders: true,
    },
  });
}
