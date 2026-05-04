import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell narrow">
      <section className="workspace-header">
        <div>
          <p className="eyebrow">Not found</p>
          <h1>This onboarding page does not exist</h1>
        </div>
        <Link className="secondary-action" href="/">
          Home
        </Link>
      </section>
    </main>
  );
}
