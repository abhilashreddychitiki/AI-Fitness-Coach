import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MemberForm } from "@/components/MemberForm";
import { getGym } from "@/lib/butterbase";

export const dynamic = "force-dynamic";

interface NewMemberPageProps {
  params: Promise<{
    gymId: string;
  }>;
}

export default async function NewMemberPage({ params }: NewMemberPageProps) {
  const { gymId } = await params;
  const gym = await getGym(gymId);

  if (!gym) {
    notFound();
  }

  return (
    <main className="app-shell narrow-shell">
      <Link className="back-link" href={`/dashboard?gymId=${gym.id}`}>
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>
      <section className="setup-hero compact">
        <div>
          <p className="eyebrow">Add member</p>
          <h1>
            One member profile.
            <span>Five videos ready next.</span>
          </h1>
          <p>{gym.name} / {gym.style_notes}</p>
        </div>
      </section>
      <MemberForm gymId={gym.id} />
    </main>
  );
}
