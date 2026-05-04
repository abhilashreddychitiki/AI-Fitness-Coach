import { NextResponse } from "next/server";
import { updatePlanVideo } from "@/lib/butterbase";
import type { VideoStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: VideoStatus[] = ["pending", "generating", "ready", "failed"];

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const planId = text(body.planId || body.plan_id);
    const videoIndex = Number(body.videoIndex ?? body.video_index);
    const status = text(body.status) as VideoStatus;
    const videoUrl = text(body.video_url || body.videoUrl);
    const generationId = text(body.generationId || body.generation_id);

    if (!planId || !Number.isInteger(videoIndex) || !STATUSES.includes(status)) {
      return NextResponse.json({ error: "planId, videoIndex, and status are required" }, { status: 400 });
    }

    const plan = await updatePlanVideo(planId, videoIndex, {
      status,
      video_url: videoUrl || undefined,
      generationId: generationId || undefined
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    console.error("Webhook handling failed", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
