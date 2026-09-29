import type Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { SITE_CONTENT } from "../content";

const BACKGROUND_STREAM = "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";

export default function SpatialEnvironment() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let hls: Hls | undefined;
    let disposed = false;
    const setLiveWhenPlaying = () => {
      if (!disposed) setLive(true);
    };
    const fallBackToPoster = () => {
      if (disposed) return;
      setLive(false);
      hls?.destroy();
      hls = undefined;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    const tryPlay = () => {
      if (!disposed) void video.play().catch(() => setLive(false));
    };

    video.addEventListener("playing", setLiveWhenPlaying);
    video.addEventListener("error", fallBackToPoster);
    video.addEventListener("canplay", tryPlay);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = BACKGROUND_STREAM;
      video.load();
    } else {
      void import("hls.js").then(({ default: HlsModule }) => {
        if (disposed || !HlsModule.isSupported()) return;
        hls = new HlsModule({
          enableWorker: true,
          capLevelToPlayerSize: true,
          maxBufferLength: 12,
          maxMaxBufferLength: 24,
          startLevel: -1,
        });
        hls.on(HlsModule.Events.MEDIA_ATTACHED, () => hls?.loadSource(BACKGROUND_STREAM));
        hls.on(HlsModule.Events.ERROR, (_event, data) => {
          if (data.fatal) fallBackToPoster();
        });
        hls.attachMedia(video);
      }).catch(() => setLive(false));
    }

    const retry = window.setTimeout(tryPlay, 900);
    return () => {
      disposed = true;
      window.clearTimeout(retry);
      video.removeEventListener("playing", setLiveWhenPlaying);
      video.removeEventListener("error", fallBackToPoster);
      video.removeEventListener("canplay", tryPlay);
      hls?.destroy();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  return (
    <div className={`spatial-environment ${live ? "is-live" : ""}`} aria-hidden="true">
      <div className="spatial-poster" style={{ backgroundImage: `url("${SITE_CONTENT.heroImage}")` }} />
      <video
        ref={videoRef}
        className="spatial-background-video"
        poster={SITE_CONTENT.heroImage}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        tabIndex={-1}
      />
      <div className="spatial-veil" />
      <div className="spatial-grid-overlay" />
    </div>
  );
}
