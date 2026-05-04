import { NextResponse } from "next/server";
import { getPlanWithRelations } from "@/lib/butterbase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const params = await context.params;
  const result = await getPlanWithRelations(params.id);

  if (!result) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
