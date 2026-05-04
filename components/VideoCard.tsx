import type { PlanVideo } from "@/types";

interface VideoCardProps {
  index: number;
  video: PlanVideo;
  onRetry: (index: number) => void;
}

export function VideoCard({ index, video, onRetry }: VideoCardProps) {
  const isReady = video.status === "ready" && video.video_url;
  const label = `Video ${index + 1}`;

  return (
    <article className={`video-card ${video.status}`}>
      <div className="video-frame">
        {isReady ? (
          <video src={video.video_url} controls preload="metadata" />
        ) : (
          <div className="video-placeholder">
            <div className="loader-bar" />
            <span>{video.status === "failed" ? "Generation failed" : "Rendering video"}</span>
          </div>
        )}
      </div>

      <div className="video-copy">
        <div className="video-meta">
          <span>{label}</span>
          <strong>{video.status}</strong>
        </div>
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        {video.status === "failed" && video.error ? <p className="video-error">{video.error}</p> : null}
        {video.status === "failed" ? (
          <button className="secondary-action" type="button" onClick={() => onRetry(index)}>
            Retry render
          </button>
        ) : null}
      </div>
    </article>
  );
}
