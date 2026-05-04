import type { Plan, PlanVideo } from "@/types";

export function countReadyVideos(videos: PlanVideo[]): number {
  return videos.filter((video) => video.status === "ready").length;
}

export function planProgressText(plan?: Plan | null): string {
  if (!plan) {
    return "Profile created";
  }

  return `${countReadyVideos(plan.videos)} of ${plan.videos.length} videos generated`;
}

export function planCompletion(plan?: Plan | null): number {
  if (!plan || plan.videos.length === 0) {
    return 0;
  }

  return Math.round((countReadyVideos(plan.videos) / plan.videos.length) * 100);
}
