import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Detects if a URL is from a video hosting service and converts it to an embed URL
 * @param url - The video URL to check
 * @returns Object with embedUrl (if applicable) and isEmbed flag
 */
export function getVideoEmbedInfo(url: string): {
  embedUrl: string | null;
  isEmbed: boolean;
} {
  if (!url || typeof url !== "string") {
    return { embedUrl: null, isEmbed: false };
  }

  try {
    const urlObj = new URL(url);

    // YouTube
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      let videoId: string | null = null;

      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.includes("/watch")) {
        videoId = urlObj.searchParams.get("v");
      } else if (urlObj.pathname.includes("/embed/")) {
        videoId = urlObj.pathname.split("/embed/")[1];
      }

      if (videoId) {
        // Remove any additional parameters from video ID
        videoId = videoId.split("&")[0].split("?")[0];
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          isEmbed: true,
        };
      }
    }

    // Vimeo
    if (urlObj.hostname.includes("vimeo.com")) {
      const videoId = urlObj.pathname.split("/").filter(Boolean).pop();
      if (videoId) {
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          isEmbed: true,
        };
      }
    }

    // Dailymotion
    if (urlObj.hostname.includes("dailymotion.com")) {
      const videoId = urlObj.pathname.split("/video/")[1]?.split("?")[0];
      if (videoId) {
        return {
          embedUrl: `https://www.dailymotion.com/embed/video/${videoId}`,
          isEmbed: true,
        };
      }
    }

    // Loom
    if (urlObj.hostname.includes("loom.com")) {
      const videoId = urlObj.pathname.split("/share/")[1]?.split("?")[0];
      if (videoId) {
        return {
          embedUrl: `https://www.loom.com/embed/${videoId}`,
          isEmbed: true,
        };
      }
    }

    // Direct video file URLs (mp4, webm, etc.)
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"];
    const isDirectVideo = videoExtensions.some((ext) =>
      url.toLowerCase().includes(ext)
    );

    return {
      embedUrl: null,
      isEmbed: false,
    };
  } catch (error) {
    // If URL parsing fails, assume it's not an embed
    return { embedUrl: null, isEmbed: false };
  }
}
