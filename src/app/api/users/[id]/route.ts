import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { deleteUser, updateUser } from "@/services/users";

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  tempPassword: z.string().min(6).optional(),
});

function generateTempPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*";
  let pwd = "";
  for (let i = 0; i < 6; i++) pwd += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 4; i++) pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
  for (let i = 0; i < 2; i++) pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));
  return pwd;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const body = updateUserSchema.parse(await request.json());

    // إذا كان الطلب يتضمن تفعيل الحساب (isActive: true)، نضمن توليد كلمة مرور مؤقتة لإعادة إنشاء حساب Auth
    let tempPassword = body.tempPassword;
    if (body.isActive === true && !tempPassword) {
      tempPassword = generateTempPassword();
    }

    const updatedUser = await updateUser(
      user.id,
      id,
      { ...body, tempPassword },
      user.role
    );
    return NextResponse.json({ user: updatedUser, tempPassword });
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { id } = await params;
    const deletedUser = await deleteUser(user.id, user.role, id);
    return NextResponse.json({ user: deletedUser, ok: true });
  });
}
