"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import type { PlanWithRelations } from "@/types";

interface PlanDashboardProps {
  initialData: PlanWithRelations;
}

export function PlanDashboard({ initialData }: PlanDashboardProps) {
  const [data, setData] = useState(initialData);
  const [copyStatus, setCopyStatus] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  const readyCount = useMemo(
    () => data.plan.videos.filter((video) => video.status === "ready").length,
    [data.plan.videos]
  );
  const failedIndexes = useMemo(
    () =>
      data.plan.videos
        .map((video, index) => ({ video, index }))
        .filter(({ video }) => video.status === "failed")
        .map(({ index }) => index),
    [data.plan.videos]
  );
  const activeCount = useMemo(
    () => data.plan.videos.filter((video) => video.status === "generating" || video.status === "pending").length,
    [data.plan.videos]
  );
  const progress = Math.round((readyCount / data.plan.videos.length) * 100);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/plans/${data.plan.id}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as PlanWithRelations;
    setData(payload);
  }, [data.plan.id]);

  useEffect(() => {
    if (data.plan.status === "ready" || data.plan.status === "failed") {
      return;
    }

    const interval = window.setInterval(() => {
      void refresh();
    }, 5_000);

    return () => window.clearInterval(interval);
  }, [data.plan.status, refresh]);

  async function copyLink(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);
    setCopyStatus("Copied");
    window.setTimeout(() => setCopyStatus(""), 1_500);
  }

  async function retryVideo(index: number): Promise<void> {
    const video = data.plan.videos[index];
    await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: data.plan.id,
        videoIndex: index,
        seedancePrompt: video.seedancePrompt
      })
    });
    await refresh();
  }

  async function retryFailedVideos(): Promise<void> {
    setIsRetrying(true);
    try {
      await Promise.all(failedIndexes.map((index) => retryVideo(index)));
      await refresh();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <section className="plan-dashboard">
      <div className="plan-topline">
        <div>
          <p className="eyebrow">Member dashboard</p>
          <h1>{data.member.name}&apos;s onboarding plan</h1>
          <p className="muted">
            {data.gym.name} / {data.member.fitness_level} / {data.member.goal}
          </p>
        </div>
        <div className="plan-actions">
          {failedIndexes.length > 0 ? (
            <button className="primary-action" disabled={isRetrying} type="button" onClick={retryFailedVideos}>
              {isRetrying ? "Retrying..." : `Retry ${failedIndexes.length} failed`}
            </button>
          ) : null}
          <button className="secondary-action" type="button" onClick={refresh}>
            Refresh
          </button>
          <button className="secondary-action" type="button" onClick={copyLink}>
            {copyStatus || "Copy link"}
          </button>
        </div>
      </div>

      <div className={`progress-panel ${data.plan.status}`}>
        <div className="progress-stats">
          <span>{readyCount} of {data.plan.videos.length} videos ready</span>
          <strong>{data.plan.status}</strong>
        </div>
        <div className="progress-track" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="status-strip">
          <span>{activeCount} rendering</span>
          <span>{failedIndexes.length} failed</span>
          <span>{data.plan.videos.length} total</span>
        </div>
      </div>

      <div className="video-grid">
        {data.plan.videos.map((video, index) => (
          <VideoCard index={index} key={`${data.plan.id}-${index}`} video={video} onRetry={retryVideo} />
        ))}
      </div>
    </section>
  );
}
