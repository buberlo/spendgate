type DemoVideoProps = {
  caption?: string;
};

export function DemoVideo({
  caption = "Core flows — landing, intent, approval, evidence pack",
}: DemoVideoProps) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-ink shadow-[0_20px_60px_-30px_rgba(20,18,14,0.45)]">
      <video
        className="aspect-video w-full bg-ink"
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
      >
        <source src="/demo/core-flows.mp4" type="video/mp4" />
        Your browser cannot play this MP4. The same recording is at{" "}
        <a href="/demo/core-flows.mp4" className="underline">
          /demo/core-flows.mp4
        </a>
        .
      </video>
      <figcaption className="border-t border-white/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#fbf8f1]/80">
        {caption}
      </figcaption>
    </figure>
  );
}
