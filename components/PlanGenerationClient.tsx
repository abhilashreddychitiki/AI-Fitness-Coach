"use client";

import clsx from "clsx";
import Link from "next/link";
import { Play, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SignatureFlow } from "@/components/SignatureFlow";
import { StatusBadge, toneForVideoStatus } from "@/components/StatusBadge";
import { countReadyVideos } from "@/components/PlanProgress";
import type { PlanWithRelations } from "@/types";

interface PlanGenerationClientProps {
  initialData: PlanWithRelations;
}

const FLOW_LABELS = ["Welcome", "Technique", "First workout", "Community", "30-day plan"];
const DURATIONS = ["0:45", "1:10", "1:25", "0:55", "1:05"];

export function PlanGenerationClient({ initialData }: PlanGenerationClientProps) {
  const [data, setData] = useState(initialData);
  const readyCount = useMemo(() => countReadyVideos(data.plan.videos), [data.plan.videos]);
  const allReady = readyCount === data.plan.videos.length;

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/plans/${data.plan.id}`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    setData((await response.json()) as PlanWithRelations);
  }, [data.plan.id]);

  useEffect(() => {
    if (allReady || data.plan.status === "failed") {
      return;
    }

    const timer = window.setInterval(() => {
      void refresh();
    }, 3_000);

    return () => window.clearInterval(timer);
  }, [allReady, data.plan.status, refresh]);

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

  return (
    <main className="app-shell">
      <section className="plan-hero">
        <div>
          <p className="eyebrow">Live onboarding build</p>
          <h1>{data.member.name}&apos;s onboarding</h1>
          <p className="brand-voice">{data.gym.style_notes}</p>
        </div>
        <div className="hero-metric">
          <strong>{readyCount}/5</strong>
          <span>Videos ready</span>
        </div>
      </section>

      <section className="flow-panel">
        <div className="section-row">
          <div>
            <h2>Five-video flow</h2>
            <p>{allReady ? "The personalized welcome flow is ready to watch." : "Cards update automatically as renders complete."}</p>
          </div>
          <button className="secondary-button" type="button" onClick={refresh}>
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
        <SignatureFlow videos={data.plan.videos} />
      </section>

      {allReady ? (
        <section className="ready-banner">
          <span>All videos ready</span>
          <Link className="primary-button" href={`/plans/${data.plan.id}/v/0`}>
            Start watching
          </Link>
        </section>
      ) : null}

      <section className="video-flow-grid">
        {data.plan.videos.map((video, index) => {
          const isReady = video.status === "ready" && video.video_url;
          return (
            <article className={clsx("build-card", `build-${video.status}`)} key={`${data.plan.id}-${index}`}>
              <div className="build-thumb">
                {isReady ? <Play size={28} /> : <span className="pulse-dot" />}
              </div>
              <div className="build-card-copy">
                <div className="build-card-top">
                  <span>{FLOW_LABELS[index]}</span>
                  <span className="duration-badge">{DURATIONS[index]}</span>
                </div>
                <h3>{video.title}</h3>
                <StatusBadge tone={toneForVideoStatus(video.status)}>{video.status}</StatusBadge>
                {video.status === "failed" ? <p className="inline-error">{video.error || "Video render failed."}</p> : null}
              </div>
              <div className="build-card-actions">
                {isReady ? (
                  <Link className="secondary-button full-width" href={`/plans/${data.plan.id}/v/${index}`}>
                    Watch
                  </Link>
                ) : video.status === "failed" ? (
                  <button className="secondary-button full-width" type="button" onClick={() => void retryVideo(index)}>
                    Retry
                  </button>
                ) : (
                  <button className="secondary-button full-width" disabled type="button">
                    Rendering
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
