import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ensureLocalUser } from "@/services/users";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Invalid body" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json(
      { code: "INVALID_CREDENTIALS", message: "Wrong email or password" },
      { status: 401 }
    );
  }

  const result = await ensureLocalUser(email);
  if (!result.ok) {
    // جلسة Supabase موجودة لكن الحساب غير مصرح به محليًا → نسجل خروج فورًا
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        code: result.reason,
        message:
          result.reason === "INACTIVE" ? "Account deactivated" : "Account not authorized",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ name: result.name, role: result.role });
}
