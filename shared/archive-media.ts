export type ArchiveVideoPlatform = "youtube" | "instagram";

export type ParsedArchiveVideo = {
  platform: ArchiveVideoPlatform;
  canonicalUrl: string;
  embedUrl: string;
  thumbnailUrl: string | null;
  platformLabel: "YOUTUBE" | "INSTAGRAM";
};

const YOUTUBE_HOSTS = new Set(["youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Accept only supported public video URLs; never turn arbitrary user URLs into iframe sources. */
export function parseArchiveVideoUrl(rawValue: string): ParsedArchiveVideo | null {
  let url: URL;
  try {
    url = new URL(rawValue.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");

  if (YOUTUBE_HOSTS.has(host)) {
    const segments = url.pathname.split("/").filter(Boolean);
    let id = "";
    if (host === "youtu.be") {
      id = segments[0] ?? "";
    } else if (url.pathname === "/watch") {
      id = url.searchParams.get("v") ?? "";
    } else if (["shorts", "embed", "live"].includes(segments[0] ?? "")) {
      id = segments[1] ?? "";
    }
    if (!YOUTUBE_ID.test(id)) return null;
    return {
      platform: "youtube",
      canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      platformLabel: "YOUTUBE",
    };
  }

  if (INSTAGRAM_HOSTS.has(host)) {
    const match = url.pathname.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)\/?$/i);
    if (!match) return null;
    const kind = match[1]!.toLowerCase() === "reels" ? "reel" : match[1]!.toLowerCase();
    const shortcode = match[2]!;
    const canonicalUrl = `https://www.instagram.com/${kind}/${shortcode}/`;
    return {
      platform: "instagram",
      canonicalUrl,
      embedUrl: `https://www.instagram.com/${kind}/${shortcode}/embed/`,
      thumbnailUrl: null,
      platformLabel: "INSTAGRAM",
    };
  }

  return null;
}
