import { NextResponse } from "next/server";
import { createGym, listGyms } from "@/lib/butterbase";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const gyms = await listGyms();
  return NextResponse.json({ gyms });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = text(body.name);
    const equipment = textArray(body.equipment);
    const classTypes = textArray(body.class_types || body.classTypes);
    const styleNotes = text(body.style_notes || body.styleNotes);

    if (!name) {
      return NextResponse.json({ error: "Gym name is required" }, { status: 400 });
    }

    if (equipment.length === 0) {
      return NextResponse.json({ error: "Select at least one equipment option" }, { status: 400 });
    }

    const gym = await createGym({
      name,
      equipment,
      class_types: classTypes,
      style_notes: styleNotes
    });

    return NextResponse.json({ gymId: gym.id, gym }, { status: 201 });
  } catch (error) {
    console.error("Create gym failed", error);
    return NextResponse.json({ error: "Gym creation failed" }, { status: 500 });
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
}
