import { notFound, redirect } from "next/navigation";
import { VideoPlayerClient } from "@/components/VideoPlayerClient";
import { getPlanWithRelations } from "@/lib/butterbase";

export const dynamic = "force-dynamic";

interface VideoPageProps {
  params: Promise<{
    planId: string;
    videoId: string;
  }>;
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { planId, videoId } = await params;
  const data = await getPlanWithRelations(planId);
  const videoIndex = Number(videoId);

  if (!data || !Number.isInteger(videoIndex) || videoIndex < 0 || videoIndex >= data.plan.videos.length) {
    notFound();
  }

  if (data.plan.videos[videoIndex].status !== "ready") {
    redirect(`/plans/${planId}`);
  }

  return <VideoPlayerClient data={data} videoIndex={videoIndex} />;
}
