import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

// طبقة خدمات المنيو — كل كتابة على Category/Product تمر من هنا (Directives §2)
// UC-08: الكاشير مرفوض — الفرض في الـ API عبر requireRole، وهنا سجل الـ Audit

export interface CategoryInput {
  name: string;
  brandId: string;
  sortOrder?: number;
}

export interface ProductInput {
  name: string;
  price: number;
  description?: string | null;
  categoryId: string;
}

export async function listBrands() {
  return prisma.brand.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getMenuTree(brandId: string) {
  return prisma.category.findMany({
    where: { brandId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      sortOrder: true,
      isActive: true,
      products: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          isActive: true,
        },
      },
    },
  });
}

export async function createCategory(userId: string, input: CategoryInput) {
  const maxSort = await prisma.category.aggregate({
    where: { brandId: input.brandId },
    _max: { sortOrder: true },
  });

  const category = await prisma.$transaction(async (tx) => {
    const created = await tx.category.create({
      data: {
        name: input.name.trim(),
        brandId: input.brandId,
        sortOrder: input.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    await audit(tx, {
      userId,
      action: "CREATE",
      entityType: "Category",
      entityId: created.id,
      newValue: { name: created.name, brandId: created.brandId },
    });
    return created;
  });

  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: { name?: string; sortOrder?: number; isActive?: boolean }
) {
  const before = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!before) throw new Error("NOT_FOUND");

  const updated = await prisma.$transaction(async (tx) => {
    const after = await tx.category.update({ where: { id: categoryId }, data });
    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "Category",
      entityId: categoryId,
      oldValue: { name: before.name, sortOrder: before.sortOrder, isActive: before.isActive },
      newValue: { name: after.name, sortOrder: after.sortOrder, isActive: after.isActive },
    });
    return after;
  });

  return updated;
}

/** إعادة ترتيب كاتيجوريات براند كاملة — عملية واحدة ذرية */
export async function reorderCategories(userId: string, brandId: string, orderedIds: string[]) {
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.category.update({
        where: { id: orderedIds[i] },
        data: { sortOrder: i + 1 },
      });
    }
    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "Category",
      entityId: brandId,
      newValue: { reorder: orderedIds },
    });
  });
}

export async function createProduct(userId: string, input: ProductInput) {
  if (input.price <= 0) throw new Error("INVALID_PRICE");

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: input.name.trim(),
        price: new Prisma.Decimal(input.price),
        description: input.description?.trim() || null,
        categoryId: input.categoryId,
      },
    });
    await audit(tx, {
      userId,
      action: "CREATE",
      entityType: "Product",
      entityId: created.id,
      newValue: { name: created.name, price: input.price, categoryId: input.categoryId },
    });
    return created;
  });

  return product;
}

export async function updateProduct(
  userId: string,
  productId: string,
  data: { name?: string; price?: number; description?: string | null; categoryId?: string; isActive?: boolean }
) {
  if (data.price !== undefined && data.price <= 0) throw new Error("INVALID_PRICE");

  const before = await prisma.product.findUnique({ where: { id: productId } });
  if (!before) throw new Error("NOT_FOUND");

  const patch: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) patch.name = data.name.trim();
  if (data.price !== undefined) patch.price = new Prisma.Decimal(data.price);
  if (data.description !== undefined) patch.description = data.description?.trim() || null;
  if (data.categoryId !== undefined) patch.category = { connect: { id: data.categoryId } };
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  const updated = await prisma.$transaction(async (tx) => {
    const after = await tx.product.update({ where: { id: productId }, data: patch });
    await audit(tx, {
      userId,
      action: "UPDATE",
      entityType: "Product",
      entityId: productId,
      oldValue: { name: before.name, price: Number(before.price), isActive: before.isActive },
      newValue: { name: after.name, price: Number(after.price), isActive: after.isActive },
    });
    return after;
  });

  return updated;
}
