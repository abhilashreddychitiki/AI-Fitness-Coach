import { notFound } from "next/navigation";
import { PlanGenerationClient } from "@/components/PlanGenerationClient";
import { getPlanWithRelations } from "@/lib/butterbase";

export const dynamic = "force-dynamic";

interface PlanPageProps {
  params: Promise<{
    planId: string;
  }>;
}

export default async function PlanPage({ params }: PlanPageProps) {
  const { planId } = await params;
  const data = await getPlanWithRelations(planId);

  if (!data) {
    notFound();
  }

  return <PlanGenerationClient initialData={data} />;
}
