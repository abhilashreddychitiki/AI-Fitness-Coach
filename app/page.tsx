import Link from "next/link";
import { SignatureFlow } from "@/components/SignatureFlow";
import { listGyms, listPlansByGym } from "@/lib/butterbase";
import { planProgressText } from "@/components/PlanProgress";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const gyms = await listGyms();
  const recentGyms = await Promise.all(
    gyms.slice(0, 4).map(async (gym) => {
      const plans = await listPlansByGym(gym.id);
      return { gym, latestPlan: plans[0] || null };
    })
  );

  return (
    <main className="app-shell">
      <section className="landing-hero">
        <div>
          <p className="eyebrow">AI Fitness Coach</p>
          <h1>
            One profile in.
            <span>A 5-video welcome flow out.</span>
          </h1>
          <p className="hero-copy">
            Premium fitness onboarding software that turns a gym profile and member goal into a personalized video
            sequence in under two minutes.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/dashboard">
              Owner dashboard
            </Link>
            {gyms[0] ? (
              <Link className="secondary-button" href={`/dashboard?gymId=${gyms[0].id}`}>
                Continue latest gym
              </Link>
            ) : null}
          </div>
          <p className="trust-copy">200+ gyms · 12k member videos · ~90s to generate.</p>
        </div>

        <aside className="hero-flow-card">
          <div className="flow-card-header">
            <span>Signature flow</span>
            <strong>5 videos</strong>
          </div>
          <SignatureFlow />
        </aside>
      </section>

      <section className="recent-section">
        <div className="section-row">
          <div>
            <p className="eyebrow">Return to flow</p>
            <h2>Recent gyms</h2>
          </div>
          <Link className="secondary-button" href="/dashboard">
            Create gym
          </Link>
        </div>
        <div className="recent-grid">
          {recentGyms.length > 0 ? (
            recentGyms.map(({ gym, latestPlan }) => (
              <Link className="return-card" href={`/dashboard?gymId=${gym.id}`} key={gym.id}>
                <strong>{gym.name}</strong>
                <span>{planProgressText(latestPlan)}</span>
                <div className="mini-progress">
                  <span style={{ width: `${latestPlan ? Math.round((latestPlan.videos.filter((video) => video.status === "ready").length / latestPlan.videos.length) * 100) : 0}%` }} />
                </div>
              </Link>
            ))
          ) : (
            <div className="empty-state">
              <strong>No gyms yet</strong>
              <span>Create a gym profile to start the two-minute demo.</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
