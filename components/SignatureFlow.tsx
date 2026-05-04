import clsx from "clsx";
import { Check, Circle, Play } from "lucide-react";
import { StatusBadge, toneForVideoStatus } from "@/components/StatusBadge";
import type { PlanVideo, VideoStatus } from "@/types";

const DEFAULT_STEPS = ["Welcome", "Technique", "First workout", "Community", "30-day plan"];

interface SignatureFlowProps {
  videos?: PlanVideo[];
  compact?: boolean;
}

export function SignatureFlow({ videos, compact = false }: SignatureFlowProps) {
  const steps = videos?.length
    ? videos.map((video, index) => ({
        title: DEFAULT_STEPS[index] || video.title,
        status: video.status
      }))
    : DEFAULT_STEPS.map((title) => ({ title, status: "pending" as VideoStatus }));

  return (
    <div className={clsx("signature-flow", compact && "signature-flow-compact")}>
      {steps.map((step, index) => (
        <div className={clsx("flow-step", `flow-${step.status}`)} key={`${step.title}-${index}`}>
          <span className="flow-index">
            {step.status === "ready" ? <Check size={14} /> : step.status === "generating" ? <Play size={14} /> : <Circle size={11} />}
          </span>
          <span className="flow-title">{step.title}</span>
          {!compact ? <StatusBadge tone={toneForVideoStatus(step.status)}>{step.status}</StatusBadge> : null}
        </div>
      ))}
    </div>
  );
}
