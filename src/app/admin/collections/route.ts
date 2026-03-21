// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  const page=Math.max(1,parseInt(req.nextUrl.searchParams.get("page")||"1"));
  const search=req.nextUrl.searchParams.get("search")||"";
  const winner=req.nextUrl.searchParams.get("winner")||"";
  const limit=20;
  const where:any={};
  if(search) where.OR=[{customerPhone:{contains:search}},{customerName:{contains:search}},{code:{contains:search}}];
  if(winner==="yes") where.isWinner=true;
  if(winner==="no")  where.isWinner=false;
  const [items,total]=await Promise.all([
    prisma.collectedCode.findMany({where,orderBy:{collectedAt:"desc"},skip:(page-1)*limit,take:limit,
      include:{merchant:{select:{name:true,phone:true}},campaign:{select:{name:true}},prize:{select:{name:true}}}}),
    prisma.collectedCode.count({where}),
  ]);
  return NextResponse.json({items,total,pages:Math.ceil(total/limit)});
}
export async function PATCH(req: NextRequest) {
  const _u = requireAdmin(req); if (_u instanceof NextResponse) return _u;
  try{
    const {id,claimStatus}=await req.json();
    const updated=await prisma.collectedCode.update({where:{id:Number(id)},data:{claimStatus,...(claimStatus==="claimed"?{claimedAt:new Date()}:{})}});
    return NextResponse.json({item:updated,message:"อัปเดตสำเร็จ"});
  }catch{ return NextResponse.json({error:"เกิดข้อผิดพลาด"},{status:500}); }
}
