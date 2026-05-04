import { updatePlanVideo } from "@/lib/butterbase";
import { generateVideo } from "@/lib/seedance";
import type { Plan } from "@/types";

const activeJobs = new Set<string>();

export function startPlanVideoJobs(plan: Plan): void {
  plan.videos.forEach((video, index) => {
    startVideoGeneration(plan.id, index, video.seedancePrompt);
  });
}

export function startVideoGeneration(planId: string, videoIndex: number, seedancePrompt: string): void {
  const jobKey = `${planId}:${videoIndex}`;
  if (activeJobs.has(jobKey)) {
    return;
  }

  activeJobs.add(jobKey);

  void runVideoGeneration(planId, videoIndex, seedancePrompt).finally(() => {
    activeJobs.delete(jobKey);
  });
}

export async function runVideoGeneration(
  planId: string,
  videoIndex: number,
  seedancePrompt: string
): Promise<void> {
  await updatePlanVideo(planId, videoIndex, {
    status: "generating",
    error: undefined
  });

  try {
    const generated = await generateVideo(seedancePrompt, videoIndex);
    await updatePlanVideo(planId, videoIndex, {
      status: "ready",
      generationId: generated.generationId,
      video_url: generated.videoUrl,
      error: undefined
    });
  } catch (error) {
    console.error("Video generation failed", error);
    await updatePlanVideo(planId, videoIndex, {
      status: "failed",
      error: error instanceof Error ? error.message : "Video generation failed"
    });
  }
}
