import { NextResponse } from "next/server";
import { createMember, listMembersByGym } from "@/lib/butterbase";
import type { FitnessGoal, FitnessLevel } from "@/types";

export const runtime = "nodejs";

const GOALS: FitnessGoal[] = [
  "strength",
  "weight loss",
  "endurance",
  "mobility",
  "muscle gain",
  "general fitness",
  "rehab"
];
const LEVELS: FitnessLevel[] = ["beginner", "intermediate", "advanced"];

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const gymId = url.searchParams.get("gymId");

  if (!gymId) {
    return NextResponse.json({ error: "gymId is required" }, { status: 400 });
  }

  const members = await listMembersByGym(gymId);
  return NextResponse.json({ members });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const gymId = text(body.gym_id || body.gymId);
    const name = text(body.name);
    const goal = text(body.goal) as FitnessGoal;
    const fitnessLevel = text(body.fitness_level || body.fitnessLevel) as FitnessLevel;
    const injuries = text(body.injuries);

    if (!gymId || !name) {
      return NextResponse.json({ error: "Gym and member name are required" }, { status: 400 });
    }

    if (!GOALS.includes(goal)) {
      return NextResponse.json({ error: "Choose a valid member goal" }, { status: 400 });
    }

    if (!LEVELS.includes(fitnessLevel)) {
      return NextResponse.json({ error: "Choose a valid fitness level" }, { status: 400 });
    }

    const member = await createMember({
      gym_id: gymId,
      name,
      goal,
      fitness_level: fitnessLevel,
      injuries
    });

    return NextResponse.json({ memberId: member.id, member }, { status: 201 });
  } catch (error) {
    console.error("Create member failed", error);
    return NextResponse.json({ error: "Member creation failed" }, { status: 500 });
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
