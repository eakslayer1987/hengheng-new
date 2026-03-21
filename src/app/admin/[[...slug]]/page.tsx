import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
// Catch-all: redirect ทุก sub-path กลับไปที่ /admin
export default function AdminCatchAll() {
  redirect("/admin");
}
