import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding lucky draw database...");

  // Admin
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: bcrypt.hashSync("Pangjang@2026", 10) },
  });

  // Campaign
  const campaign = await prisma.campaign.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "กระเป๋าเงินปังจัง ปี 2",
      description: "สะสมแต้มกับปังจัง ลุ้นรับรางวัลมูลค่ารวม 1,000,000 บาท",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      isActive: true,
      totalBudget: 1000000,
    },
  });

  // Prizes
  const prizes = await Promise.all([
    prisma.prize.upsert({ where: { id: 1 }, update: {}, create: { id: 1, campaignId: campaign.id, name: "รางวัลที่ 1 เงินสด 100,000 บาท", value: 100000, quantity: 1, remaining: 1, sortOrder: 1 } }),
    prisma.prize.upsert({ where: { id: 2 }, update: {}, create: { id: 2, campaignId: campaign.id, name: "รางวัลที่ 2 เงินสด 50,000 บาท", value: 50000, quantity: 3, remaining: 3, sortOrder: 2 } }),
    prisma.prize.upsert({ where: { id: 3 }, update: {}, create: { id: 3, campaignId: campaign.id, name: "รางวัลที่ 3 เงินสด 10,000 บาท", value: 10000, quantity: 10, remaining: 10, sortOrder: 3 } }),
    prisma.prize.upsert({ where: { id: 4 }, update: {}, create: { id: 4, campaignId: campaign.id, name: "รางวัลพิเศษ Gift Card 500 บาท", value: 500, quantity: 100, remaining: 100, sortOrder: 4 } }),
  ]);

  // Generate test codes (1,000 codes — 5% win rate)
  const existingCount = await prisma.luckyCode.count({ where: { campaignId: campaign.id } });
  if (existingCount === 0) {
    const codes: { code: string; campaignId: number; prizeId: number | null }[] = [];
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

    // Win codes
    const winDistrib = [
      { prizeId: prizes[0].id, count: 1 },
      { prizeId: prizes[1].id, count: 3 },
      { prizeId: prizes[2].id, count: 10 },
      { prizeId: prizes[3].id, count: 50 },
    ];
    for (const { prizeId, count } of winDistrib) {
      for (let i = 0; i < count; i++) {
        codes.push({ code: genCode(chars, codes.map(c => c.code)), campaignId: campaign.id, prizeId });
      }
    }
    // Non-win codes
    for (let i = 0; i < 936; i++) {
      codes.push({ code: genCode(chars, codes.map(c => c.code)), campaignId: campaign.id, prizeId: null });
    }

    // Shuffle
    for (let i = codes.length - 1; i > 0; i--) {
      const j = ~~(Math.random() * (i + 1));
      [codes[i], codes[j]] = [codes[j], codes[i]];
    }

    await prisma.luckyCode.createMany({ data: codes, skipDuplicates: true });
    console.log(`✅ Created ${codes.length} lucky codes`);

    // Add a test winning code
    await prisma.luckyCode.upsert({
      where: { code: "TEST-WIN-001" },
      update: {},
      create: { code: "TEST-WIN-001", campaignId: campaign.id, prizeId: prizes[3].id },
    });
    await prisma.luckyCode.upsert({
      where: { code: "TEST-LOSE-01" },
      update: {},
      create: { code: "TEST-LOSE-01", campaignId: campaign.id, prizeId: null },
    });
    console.log("✅ Test codes: TEST-WIN-001 (ได้รางวัล) | TEST-LOSE-01 (ไม่ได้รางวัล)");
  }

  console.log("✅ Seed complete!");
}

function genCode(chars: string, existing: string[]): string {
  const set = new Set(existing);
  let code: string;
  do { code = Array.from({ length: 12 }, () => chars[~~(Math.random() * chars.length)]).join(""); }
  while (set.has(code));
  return code;
}

main().catch(console.error).finally(() => prisma.$disconnect());
