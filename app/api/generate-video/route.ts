import { NextResponse } from "next/server";
import { getPlan } from "@/lib/butterbase";
import { startVideoGeneration } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const planId = text(body.planId || body.plan_id);
    const videoIndex = Number(body.videoIndex ?? body.video_index);
    const seedancePrompt = text(body.seedancePrompt || body.seedance_prompt);

    if (!planId || !Number.isInteger(videoIndex) || videoIndex < 0 || videoIndex > 4 || !seedancePrompt) {
      return NextResponse.json({ error: "planId, videoIndex, and seedancePrompt are required" }, { status: 400 });
    }

    const plan = await getPlan(planId);
    if (!plan || !plan.videos[videoIndex]) {
      return NextResponse.json({ error: "Plan or video not found" }, { status: 404 });
    }

    startVideoGeneration(planId, videoIndex, seedancePrompt);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Video generation route failed", error);
    return NextResponse.json({ error: "Video generation failed" }, { status: 500 });
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
