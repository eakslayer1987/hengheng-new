// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET — list all rules
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req); if (auth instanceof NextResponse) return auth;

  const rules = await prisma.qrRule.findMany({
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ rules });
}

// POST — create rule
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req); if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { name, ruleType, value, blockMessage, priority } = body;

  if (!name || !ruleType || !value || !blockMessage)
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });

  // Validate value format per ruleType
  const validationError = validateRuleValue(ruleType, value);
  if (validationError)
    return NextResponse.json({ error: validationError }, { status: 400 });

  const rule = await prisma.qrRule.create({
    data: {
      name: String(name).trim(),
      ruleType: String(ruleType),
      value: String(value),
      blockMessage: String(blockMessage).trim(),
      priority: Number(priority) || 0,
    },
  });
  return NextResponse.json({ rule }, { status: 201 });
}

// PATCH — update rule (id in body)
export async function PATCH(req: NextRequest) {
  const auth = requireAdmin(req); if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });

  if (data.ruleType && data.value) {
    const validationError = validateRuleValue(data.ruleType, data.value);
    if (validationError)
      return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const rule = await prisma.qrRule.update({
    where: { id: Number(id) },
    data: {
      ...(data.name !== undefined && { name: String(data.name).trim() }),
      ...(data.ruleType !== undefined && { ruleType: String(data.ruleType) }),
      ...(data.value !== undefined && { value: String(data.value) }),
      ...(data.blockMessage !== undefined && { blockMessage: String(data.blockMessage).trim() }),
      ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      ...(data.priority !== undefined && { priority: Number(data.priority) }),
    },
  });
  return NextResponse.json({ rule });
}

// DELETE — delete rule (?id=xxx)
export async function DELETE(req: NextRequest) {
  const auth = requireAdmin(req); if (auth instanceof NextResponse) return auth;

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ต้องระบุ id" }, { status: 400 });

  await prisma.qrRule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// ─── Validation helpers ───────────────────────────────────────────
function validateRuleValue(ruleType: string, value: string): string | null {
  switch (ruleType) {
    case "time": {
      // "HH:MM-HH:MM"
      if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value))
        return 'รูปแบบ time ต้องเป็น "HH:MM-HH:MM" เช่น "08:00-17:00"';
      return null;
    }
    case "day_of_week": {
      // "0,1,2,3,4,5,6"
      if (!/^[0-6](,[0-6])*$/.test(value))
        return 'รูปแบบ day_of_week ต้องเป็น "0,1,2" (0=อาทิตย์ ... 6=เสาร์)';
      return null;
    }
    case "scan_count": {
      try {
        const obj = JSON.parse(value);
        if (typeof obj.from !== "number" || typeof obj.to !== "number")
          return 'scan_count ต้องมี { "from": 1, "to": 100 }';
      } catch {
        return "scan_count value ต้องเป็น JSON ที่ถูกต้อง";
      }
      return null;
    }
    case "geo":
      // value = radius in meters (number string)
      if (isNaN(Number(value)) || Number(value) <= 0)
        return "geo value ต้องเป็นตัวเลขรัศมี (เมตร) เช่น 50";
      return null;
    default:
      return null;
  }
}
