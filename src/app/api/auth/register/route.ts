import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, TransactionType } from "@prisma/client";

const schema = z.object({
  name: z.string().min(2, "Ad Soyad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  organizationName: z.string().min(2, "Organizasyon adı en az 2 karakter olmalı"),
});

const GELIR_KATEGORILERI = ["Satış Geliri", "Hizmet Geliri", "Yatırım Geliri", "Diğer Gelir"];
const GIDER_KATEGORILERI = [
  "Tedarik / Stok",
  "Kira",
  "Maaş & Bordro",
  "Pazarlama",
  "Vergi & Yasal",
  "Ofis Giderleri",
  "Diğer Gider",
];

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }
  const { name, email, password, organizationName } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta ile zaten bir hesap var" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const org = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email: normalizedEmail, passwordHash },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        memberships: { create: { userId: user.id, role: Role.OWNER } },
      },
    });

    await tx.category.createMany({
      data: [
        ...GELIR_KATEGORILERI.map((name) => ({ name, type: TransactionType.GELIR, organizationId: organization.id })),
        ...GIDER_KATEGORILERI.map((name) => ({ name, type: TransactionType.GIDER, organizationId: organization.id })),
      ],
    });

    return organization;
  });

  return NextResponse.json({ ok: true, organizationId: org.id });
}
