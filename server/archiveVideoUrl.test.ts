import { describe, expect, it } from "vitest";
import { parseArchiveVideoUrl } from "../shared/archive-media";

describe("parseArchiveVideoUrl", () => {
  it("normalizes YouTube long-form and short URLs into privacy-enhanced embeds", () => {
    const longForm = parseArchiveVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12");
    expect(longForm).toMatchObject({
      platform: "youtube",
      canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&autoplay=1",
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    });
    expect(parseArchiveVideoUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toMatchObject({ platform: "youtube" });
    expect(parseArchiveVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toMatchObject({ platform: "youtube" });
  });

  it("normalizes Instagram Reel URLs for click-to-load embeds", () => {
    expect(parseArchiveVideoUrl("https://www.instagram.com/reel/ABC_xyz-12/?igsh=example")).toMatchObject({
      platform: "instagram",
      canonicalUrl: "https://www.instagram.com/reel/ABC_xyz-12/",
      embedUrl: "https://www.instagram.com/reel/ABC_xyz-12/embed/",
      thumbnailUrl: null,
    });
  });

  it("rejects arbitrary hosts, invalid IDs, and script protocols", () => {
    expect(parseArchiveVideoUrl("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseArchiveVideoUrl("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(parseArchiveVideoUrl("javascript:alert(1)")).toBeNull();
    expect(parseArchiveVideoUrl("https://instagram.com/accounts/login/")).toBeNull();
  });
});
