"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Activity, Bike, Dumbbell, HeartPulse, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { SignatureFlow } from "@/components/SignatureFlow";

const EQUIPMENT_OPTIONS = [
  { label: "Treadmills", icon: Activity },
  { label: "Free weights", icon: Dumbbell },
  { label: "Cable machines", icon: Zap },
  { label: "Squat racks", icon: ShieldCheck },
  { label: "Rowers", icon: Activity },
  { label: "Kettlebells", icon: Dumbbell },
  { label: "Resistance bands", icon: Sparkles },
  { label: "Recovery area", icon: HeartPulse }
];

const CLASS_OPTIONS = [
  { label: "HIIT", icon: Zap },
  { label: "Yoga", icon: HeartPulse },
  { label: "Spin", icon: Bike },
  { label: "Strength", icon: Dumbbell },
  { label: "Pilates", icon: Activity },
  { label: "Boxing", icon: ShieldCheck },
  { label: "Mobility", icon: Sparkles },
  { label: "Small group", icon: Users }
];

export function GymForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState<string[]>(["Free weights", "Cable machines"]);
  const [classTypes, setClassTypes] = useState<string[]>(["Strength", "Mobility"]);
  const [styleNotes, setStyleNotes] = useState("Warm, confident, beginner-friendly coaching with a premium studio feel.");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewLine = useMemo(() => {
    const gymName = name.trim() || "your studio";
    const equipmentLine = equipment.length > 0 ? equipment.slice(0, 3).join(", ") : "your floor equipment";
    const tone = styleNotes.trim() || "clear, personal coaching";
    return `Welcome to ${gymName}. Today we will use ${equipmentLine} with ${tone.toLowerCase()}`;
  }, [equipment, name, styleNotes]);

  function loadDemoGym(): void {
    setName("North Loop Athletic Club");
    setEquipment(["Free weights", "Cable machines", "Rowers", "Kettlebells"]);
    setClassTypes(["Strength", "Mobility", "HIIT"]);
    setStyleNotes("Premium, practical, encouraging coaching for busy professionals returning to fitness.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          equipment,
          classTypes,
          styleNotes
        })
      });

      const payload = (await response.json()) as { gymId?: string; error?: string };
      if (!response.ok || !payload.gymId) {
        throw new Error(payload.error || "Could not create gym");
      }

      router.push(`/dashboard?gymId=${payload.gymId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create gym");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="builder-card gym-builder" onSubmit={handleSubmit}>
      <div className="builder-form">
        <div className="form-header">
          <div>
            <p className="eyebrow">Gym setup</p>
            <h2>Create the source profile</h2>
          </div>
          <button className="secondary-button small-button" type="button" onClick={loadDemoGym}>
            Demo fill
          </button>
        </div>

        <label className="field">
          <span>Gym name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="North Loop Athletic Club"
          />
        </label>

        <fieldset className="field">
          <legend>Equipment</legend>
          <div className="tile-grid">
            {EQUIPMENT_OPTIONS.map((option) => (
              <IconTile
                checked={equipment.includes(option.label)}
                icon={option.icon}
                key={option.label}
                label={option.label}
                onChange={() => setToggle(equipment, option.label, setEquipment)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>Classes</legend>
          <div className="tile-grid">
            {CLASS_OPTIONS.map((option) => (
              <IconTile
                checked={classTypes.includes(option.label)}
                icon={option.icon}
                key={option.label}
                label={option.label}
                onChange={() => setToggle(classTypes, option.label, setClassTypes)}
              />
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>Brand voice</span>
          <textarea value={styleNotes} onChange={(event) => setStyleNotes(event.target.value)} rows={4} />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating dashboard..." : "Create gym dashboard"}
          </button>
          <p className="trust-copy">200+ gyms · 12k member videos · ~90s to generate.</p>
        </div>
      </div>

      <aside className="live-preview-panel">
        <p className="eyebrow">Live preview</p>
        <h2>{name || "Studio onboarding"}</h2>
        <p className="preview-script">{previewLine}</p>
        <SignatureFlow compact />
        <div className="preview-tags">
          {[...equipment.slice(0, 3), ...classTypes.slice(0, 2)].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </aside>
    </form>
  );
}

interface IconTileProps {
  checked: boolean;
  icon: LucideIcon;
  label: string;
  onChange: () => void;
}

function IconTile({ checked, icon: Icon, label, onChange }: IconTileProps) {
  return (
    <label className={clsx("icon-tile", checked && "selected")}>
      <input checked={checked} onChange={onChange} type="checkbox" />
      <Icon size={18} />
      <span>{label}</span>
    </label>
  );
}

function setToggle(values: string[], option: string, setValues: (values: string[]) => void): void {
  if (values.includes(option)) {
    setValues(values.filter((value) => value !== option));
    return;
  }

  setValues([...values, option]);
}
