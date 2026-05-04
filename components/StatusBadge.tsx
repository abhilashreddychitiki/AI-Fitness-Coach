import clsx from "clsx";
import type { PlanStatus, VideoStatus } from "@/types";

type StatusTone = "pending" | "active" | "ready" | "done" | "failed";

interface StatusBadgeProps {
  children: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ children, tone = "pending", className }: StatusBadgeProps) {
  return <span className={clsx("status-badge", `status-${tone}`, className)}>{children}</span>;
}

export function toneForPlanStatus(status: PlanStatus): StatusTone {
  if (status === "ready") {
    return "ready";
  }

  if (status === "generating") {
    return "active";
  }

  if (status === "failed") {
    return "failed";
  }

  return "pending";
}

export function toneForVideoStatus(status: VideoStatus): StatusTone {
  if (status === "ready") {
    return "ready";
  }

  if (status === "generating") {
    return "active";
  }

  if (status === "failed") {
    return "failed";
  }

  return "pending";
}
