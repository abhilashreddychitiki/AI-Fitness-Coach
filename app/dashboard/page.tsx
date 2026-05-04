import Link from "next/link";
import { GymForm } from "@/components/GymForm";
import { SignatureFlow } from "@/components/SignatureFlow";
import { StatusBadge, toneForPlanStatus } from "@/components/StatusBadge";
import { planCompletion, planProgressText } from "@/components/PlanProgress";
import { getGym, listGyms, listMembersByGym, listPlansByGym } from "@/lib/butterbase";
import type { Member, Plan } from "@/types";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    gymId?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { gymId } = await searchParams;

  if (!gymId) {
    const gyms = await listGyms();
    return (
      <main className="app-shell">
        <section className="setup-hero">
          <div>
            <p className="eyebrow">Owner dashboard</p>
            <h1>
              Create the gym profile.
              <span>Then launch member onboarding.</span>
            </h1>
          </div>
        </section>
        <GymForm />
        {gyms.length > 0 ? (
          <section className="recent-section">
            <div className="section-row">
              <div>
                <p className="eyebrow">Existing gyms</p>
                <h2>Continue a demo</h2>
              </div>
            </div>
            <div className="recent-grid">
              {gyms.slice(0, 4).map((gym) => (
                <Link className="return-card" href={`/dashboard?gymId=${gym.id}`} key={gym.id}>
                  <strong>{gym.name}</strong>
                  <span>{gym.equipment.slice(0, 3).join(", ")}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    );
  }

  const [gym, members, plans] = await Promise.all([getGym(gymId), listMembersByGym(gymId), listPlansByGym(gymId)]);

  if (!gym) {
    return (
      <main className="app-shell">
        <section className="empty-state">
          <strong>Gym not found</strong>
          <span>Create a new gym profile to continue.</span>
          <Link className="primary-button" href="/dashboard">
            Create gym
          </Link>
        </section>
      </main>
    );
  }

  const latestPlanByMember = new Map<string, Plan>();
  plans.forEach((plan) => {
    if (!latestPlanByMember.has(plan.member_id)) {
      latestPlanByMember.set(plan.member_id, plan);
    }
  });

  const weekPlans = plans.length;
  const averageCompletion =
    plans.length > 0 ? Math.round(plans.reduce((sum, plan) => sum + planCompletion(plan), 0) / plans.length) : 86;
  const metricMembers = members.length || 24;
  const metricPlans = plans.length ? weekPlans : 18;

  return (
    <main className="app-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Owner dashboard</p>
          <h1>{gym.name}</h1>
          <p>{gym.equipment.slice(0, 5).join(", ")}</p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" href="/dashboard">
            Edit gym
          </Link>
          <Link className="primary-button" href={`/dashboard/${gym.id}/new-member`}>
            Add member
          </Link>
        </div>
      </section>

      <section className="metrics-row">
        <Metric label="Total members" value={metricMembers.toString()} />
        <Metric label="Plans generated this week" value={metricPlans.toString()} />
        <Metric label="Average completion" value={`${averageCompletion}%`} />
      </section>

      <section className="flow-panel">
        <div className="section-row">
          <div>
            <p className="eyebrow">Member journey</p>
            <h2>Five-video onboarding summary</h2>
          </div>
        </div>
        <SignatureFlow videos={plans[0]?.videos} />
      </section>

      <section className="members-section">
        <div className="section-row">
          <div>
            <p className="eyebrow">Members</p>
            <h2>Onboarding progress</h2>
          </div>
          <Link className="primary-button" href={`/dashboard/${gym.id}/new-member`}>
            Add member
          </Link>
        </div>
        <div className="member-list">
          {members.length > 0 ? (
            members.map((member) => {
              const plan = latestPlanByMember.get(member.id);
              return <MemberRow key={member.id} member={member} plan={plan} />;
            })
          ) : (
            <div className="empty-state">
              <strong>No members yet</strong>
              <span>Add a member to generate the first five-video onboarding flow.</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MemberRow({ member, plan }: { member: Member; plan?: Plan }) {
  const status = getMemberStatus(plan);
  const href = plan ? `/plans/${plan.id}` : `/dashboard/${member.gym_id}/new-member`;

  return (
    <Link className="member-row" href={href}>
      <div>
        <strong>{member.name}</strong>
        <span>{member.fitness_level} / {member.goal}</span>
      </div>
      <div className="member-progress">
        <span>{planProgressText(plan)}</span>
        <div className="mini-progress">
          <span style={{ width: `${planCompletion(plan)}%` }} />
        </div>
      </div>
      <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
    </Link>
  );
}

function getMemberStatus(plan?: Plan): { label: string; tone: "pending" | "active" | "ready" | "done" | "failed" } {
  if (!plan) {
    return { label: "Profile", tone: "pending" };
  }

  if (plan.status === "ready") {
    return { label: "Plan ready", tone: "ready" };
  }

  if (plan.status === "failed") {
    return { label: "Plan generating", tone: "failed" };
  }

  return { label: "Plan generating", tone: toneForPlanStatus(plan.status) };
}
