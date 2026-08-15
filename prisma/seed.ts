import { PrismaClient, Role, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo Kullanıcı",
      email: "demo@example.com",
      passwordHash,
    },
  });

  const org = await prisma.organization.create({
    data: {
      name: "Demo Şirketi",
      memberships: {
        create: { userId: user.id, role: Role.OWNER },
      },
    },
  });

  const categoryRecords: Record<string, string> = {};
  for (const name of GELIR_KATEGORILERI) {
    const c = await prisma.category.create({
      data: { name, type: TransactionType.GELIR, organizationId: org.id },
    });
    categoryRecords[`GELIR:${name}`] = c.id;
  }
  for (const name of GIDER_KATEGORILERI) {
    const c = await prisma.category.create({
      data: { name, type: TransactionType.GIDER, organizationId: org.id },
    });
    categoryRecords[`GIDER:${name}`] = c.id;
  }

  const sample = [
    { type: "GELIR", cat: "Satış Geliri", amount: 42500, desc: "Ocak ayı toplu sipariş", daysAgo: 20 },
    { type: "GIDER", cat: "Tedarik / Stok", amount: 15800, desc: "Filament tedariki", daysAgo: 18 },
    { type: "GIDER", cat: "Kira", amount: 9000, desc: "Atölye kirası", daysAgo: 15 },
    { type: "GELIR", cat: "Hizmet Geliri", amount: 6200, desc: "Özel tasarım baskı hizmeti", daysAgo: 10 },
    { type: "GIDER", cat: "Maaş & Bordro", amount: 21000, desc: "Personel maaşları", daysAgo: 5 },
    { type: "GELIR", cat: "Satış Geliri", amount: 18750, desc: "Online mağaza siparişleri", daysAgo: 2 },
  ] as const;

  for (const s of sample) {
    const date = new Date();
    date.setDate(date.getDate() - s.daysAgo);
    await prisma.transaction.create({
      data: {
        type: s.type as TransactionType,
        amount: s.amount,
        description: s.desc,
        date,
        organizationId: org.id,
        categoryId: categoryRecords[`${s.type}:${s.cat}`],
        createdById: user.id,
      },
    });
  }

  console.log("Seed tamamlandı. Giriş: demo@example.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
