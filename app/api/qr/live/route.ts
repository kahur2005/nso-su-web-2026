import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const npcId = searchParams.get("npcId");

  if (!npcId) {
    return NextResponse.json({ error: "NPC ID is required" }, { status: 400 });
  }

  const { data: npc, error } = await supabase
    .from("NPC")
    .select("id, committeeName, role, points, isActive")
    .eq("id", npcId)
    .maybeSingle();

  if (error || !npc) {
    return NextResponse.json(
      { error: "Committee member not found" },
      { status: 404 },
    );
  }

  if (!npc.isActive) {
    return NextResponse.json(
      { error: "This committee member is inactive" },
      { status: 400 },
    );
  }

  const now = Date.now();
  const expiresAt = now + 90 * 1000;

  // Generate short-lived JWT token valid for 60 seconds.
  const token = jwt.sign(
    {
      npcId: npc.id,
      points: npc.points,
      ts: now,
      live: true,
    },
    process.env.QR_SECRET_KEY!,
    { expiresIn: "90s" },
  );

  const scanUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/scan?token=${token}`;
  const qrCodeImage = await QRCode.toDataURL(scanUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  return NextResponse.json({
    success: true,
    qrCode: qrCodeImage,
    expiresAt,
    npcName: npc.committeeName,
    role: npc.role,
    points: npc.points,
  });
}
