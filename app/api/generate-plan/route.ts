import { NextResponse } from "next/server";
import { createPlan, getGym, getMember } from "@/lib/butterbase";
import { startPlanVideoJobs } from "@/lib/jobs";
import { generatePlanWithZai } from "@/lib/zai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const memberId = text(body.memberId || body.member_id);
    const gymId = text(body.gymId || body.gym_id);

    if (!memberId || !gymId) {
      return NextResponse.json({ error: "memberId and gymId are required" }, { status: 400 });
    }

    const [member, gym] = await Promise.all([getMember(memberId), getGym(gymId)]);
    if (!member || !gym) {
      return NextResponse.json({ error: "Member or gym not found" }, { status: 404 });
    }

    if (member.gym_id !== gym.id) {
      return NextResponse.json({ error: "Member does not belong to this gym" }, { status: 400 });
    }

    const videos = await generatePlanWithZai(member, gym);
    const plan = await createPlan({
      member_id: member.id,
      gym_id: gym.id,
      videos,
      status: "pending"
    });

    startPlanVideoJobs(plan);

    return NextResponse.json({ planId: plan.id, plan }, { status: 201 });
  } catch (error) {
    console.error("Plan generation failed", error);
    return NextResponse.json({ error: "Plan generation failed" }, { status: 500 });
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
