"use client";

import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { SignatureFlow } from "@/components/SignatureFlow";
import type { PlanWithRelations } from "@/types";

interface VideoPlayerClientProps {
  data: PlanWithRelations;
  videoIndex: number;
}

export function VideoPlayerClient({ data, videoIndex }: VideoPlayerClientProps) {
  const currentVideo = data.plan.videos[videoIndex];
  const upNext = data.plan.videos
    .map((video, index) => ({ video, index }))
    .filter(({ index }) => index !== videoIndex);

  return (
    <main className="app-shell">
      <Link className="back-link" href={`/plans/${data.plan.id}`}>
        <ArrowLeft size={16} />
        Back to plan
      </Link>

      <section className="player-layout">
        <div className="player-column">
          <div className="player-frame">
            {currentVideo.video_url ? (
              <video src={currentVideo.video_url} controls preload="metadata" />
            ) : (
              <div className="player-empty">Video is still rendering</div>
            )}
          </div>
          <div className="player-copy">
            <p className="eyebrow">Personalized video</p>
            <h1>{currentVideo.title}</h1>
            <p>
              Built for {data.member.name} at {data.gym.name}.
            </p>
            <p className="brand-voice">{data.gym.style_notes}</p>
          </div>
        </div>

        <aside className="notes-panel">
          <h2>Coaching notes</h2>
          <p>{currentVideo.description}</p>
          <div className="notes-meta">
            <span>{data.member.fitness_level}</span>
            <span>{data.member.goal}</span>
            <span>{data.member.injuries || "No limitations listed"}</span>
          </div>
        </aside>
      </section>

      <section className="up-next-section">
        <div className="section-row">
          <div>
            <h2>Up next</h2>
            <p>Continue through the same five-step onboarding sequence.</p>
          </div>
        </div>
        <SignatureFlow videos={data.plan.videos} compact />
        <div className="up-next-strip">
          {upNext.map(({ video, index }) => (
            <Link className="up-next-card" href={`/plans/${data.plan.id}/v/${index}`} key={`${video.title}-${index}`}>
              <span className="mini-thumb">
                <Play size={16} />
              </span>
              <span>
                <strong>{video.title}</strong>
                <small>{video.status === "ready" ? "Ready to watch" : "Still rendering"}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
