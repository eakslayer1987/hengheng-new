// @ts-nocheck
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, number | boolean | string> = {
  daily_collect_limit: 3,
  gps_radius_m: 20,
  otp_expire_min: 5,
  otp_cooldown_sec: 60,
  registration_open: true,
};

export async function getConfig(key: string): Promise<string> {
  try {
    const r = await prisma.systemConfig.findUnique({ where: { key } });
    return r?.value ?? String(DEFAULTS[key] ?? "");
  } catch {
    return String(DEFAULTS[key] ?? "");
  }
}

export async function getConfigInt(key: string): Promise<number> {
  return parseInt(await getConfig(key)) || (DEFAULTS[key] as number) || 0;
}

export async function getConfigBool(key: string): Promise<boolean> {
  return (await getConfig(key)) !== "false";
}
