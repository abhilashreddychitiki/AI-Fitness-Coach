import { notFound, redirect } from "next/navigation";
import { getLatestPlanForMember, getMember } from "@/lib/butterbase";

export const dynamic = "force-dynamic";

interface MemberPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    planId?: string;
  }>;
}

export default async function MemberPage({ params, searchParams }: MemberPageProps) {
  const [{ id }, { planId }] = await Promise.all([params, searchParams]);
  const member = await getMember(id);

  if (!member) {
    notFound();
  }

  if (planId) {
    redirect(`/plans/${planId}`);
  }

  const latestPlan = await getLatestPlanForMember(member.id);
  if (latestPlan) {
    redirect(`/plans/${latestPlan.id}`);
  }

  redirect(`/dashboard?gymId=${member.gym_id}`);
}
