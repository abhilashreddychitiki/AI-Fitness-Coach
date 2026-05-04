"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Activity, Dumbbell, HeartPulse, Mountain, ShieldAlert, Sparkles, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { FitnessGoal, FitnessLevel } from "@/types";

const GOALS: Array<{ label: string; value: FitnessGoal; icon: LucideIcon }> = [
  { label: "Strength", value: "strength", icon: Dumbbell },
  { label: "Weight loss", value: "weight loss", icon: Target },
  { label: "Endurance", value: "endurance", icon: Activity },
  { label: "Mobility", value: "mobility", icon: HeartPulse }
];

const LEVELS: Array<{ label: string; value: FitnessLevel }> = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" }
];

const LIMITATION_CHIPS = [
  { label: "Knee", icon: ShieldAlert },
  { label: "Lower back", icon: Mountain },
  { label: "Shoulder", icon: Activity },
  { label: "None", icon: Sparkles }
];

interface MemberFormProps {
  gymId: string;
}

export function MemberForm({ gymId }: MemberFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<FitnessGoal>("strength");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("beginner");
  const [limitations, setLimitations] = useState<string[]>([]);
  const [limitationsText, setLimitationsText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadDemoMember(): void {
    setName("Maya Johnson");
    setGoal("strength");
    setFitnessLevel("beginner");
    setLimitations(["Knee"]);
    setLimitationsText("Sensitive right knee; prefers low-impact conditioning.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setStatus("Saving profile...");
    setIsSubmitting(true);

    const limitationCopy =
      limitations.includes("None") && !limitationsText.trim()
        ? "none"
        : [...limitations.filter((item) => item !== "None"), limitationsText.trim()].filter(Boolean).join("; ");

    try {
      const memberResponse = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gymId,
          name,
          goal,
          fitnessLevel,
          injuries: limitationCopy
        })
      });

      const memberPayload = (await memberResponse.json()) as { memberId?: string; error?: string };
      if (!memberResponse.ok || !memberPayload.memberId) {
        throw new Error(memberPayload.error || "Could not save member");
      }

      setStatus("Generating five-video onboarding...");
      const planResponse = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: memberPayload.memberId,
          gymId
        })
      });

      const planPayload = (await planResponse.json()) as { planId?: string; error?: string };
      if (!planResponse.ok || !planPayload.planId) {
        throw new Error(planPayload.error || "Could not generate plan");
      }

      router.push(`/plans/${planPayload.planId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create onboarding plan");
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleLimitation(label: string): void {
    if (label === "None") {
      setLimitations(limitations.includes("None") ? [] : ["None"]);
      return;
    }

    const withoutNone = limitations.filter((item) => item !== "None");
    setLimitations(
      withoutNone.includes(label) ? withoutNone.filter((item) => item !== label) : [...withoutNone, label]
    );
  }

  return (
    <form className="builder-card member-builder" onSubmit={handleSubmit}>
      <div className="form-header">
        <div>
          <p className="eyebrow">New member</p>
          <h2>Create a personalized welcome</h2>
        </div>
        <button className="secondary-button small-button" type="button" onClick={loadDemoMember}>
          Demo fill
        </button>
      </div>

      <label className="field">
        <span>Member name</span>
        <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya Johnson" />
      </label>

      <fieldset className="field">
        <legend>Primary goal</legend>
        <div className="tile-grid">
          {GOALS.map((option) => {
            const Icon = option.icon;
            return (
              <label className={clsx("icon-tile", goal === option.value && "selected")} key={option.value}>
                <input checked={goal === option.value} name="goal" onChange={() => setGoal(option.value)} type="radio" />
                <Icon size={18} />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Experience level</legend>
        <div className="segmented-control">
          {LEVELS.map((option) => (
            <label className={fitnessLevel === option.value ? "selected" : ""} key={option.value}>
              <input
                checked={fitnessLevel === option.value}
                name="fitnessLevel"
                onChange={() => setFitnessLevel(option.value)}
                type="radio"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>Limitations</legend>
        <div className="chip-grid">
          {LIMITATION_CHIPS.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                className={clsx("chip-button", limitations.includes(chip.label) && "selected")}
                key={chip.label}
                onClick={() => toggleLimitation(chip.label)}
                type="button"
              >
                <Icon size={16} />
                {chip.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="field">
        <span>Additional notes</span>
        <textarea
          value={limitationsText}
          onChange={(event) => setLimitationsText(event.target.value)}
          placeholder="Optional context for the trainer"
          rows={3}
        />
      </label>

      {status ? <p className="form-status">{status}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div>
        <button className="primary-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Generating..." : "Generate plan"}
        </button>
        <p className="trust-copy">200+ gyms · 12k member videos · ~90s to generate.</p>
      </div>
    </form>
  );
}
