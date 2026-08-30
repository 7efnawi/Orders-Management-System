import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import { isResponse, requireApiRole, wrapApi } from "@/lib/api";
import { listUsers, createUser } from "@/services/users";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email format"),
  role: z.nativeEnum(Role),
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

export async function GET(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const { searchParams } = new URL(request.url);
    const rawRole = searchParams.get("role");
    let role = rawRole && Object.values(Role).includes(rawRole as Role)
      ? (rawRole as Role)
      : undefined;

    // المدير يرى فقط الكاشيرات
    if (user.role === "MANAGER") {
      role = Role.CASHIER;
    }

    const rawActive = searchParams.get("isActive");
    const isActive = rawActive !== null && rawActive !== undefined
      ? rawActive === "true"
      : undefined;

    const search = searchParams.get("search") || undefined;

    const users = await listUsers({ role, isActive, search });
    return NextResponse.json({ users });
  });
}

export async function POST(request: NextRequest) {
  return wrapApi(async () => {
    const user = await requireApiRole("OWNER", "MANAGER");
    if (isResponse(user)) return user;

    const body = createUserSchema.parse(await request.json());
    const tempPassword = body.tempPassword || generateTempPassword();

    const createdUser = await createUser(
      user.id,
      { ...body, tempPassword },
      user.role
    );
    return NextResponse.json({ user: createdUser, tempPassword }, { status: 201 });
  });
}
