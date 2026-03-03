const MIME_TYPE_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".flv": "video/x-flv",
  ".wmv": "video/x-ms-wmv",
  ".m4v": "video/x-m4v",
  ".3gp": "video/3gpp",
  ".ts": "video/mp2t",
  ".mp3": "audio/mpeg",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".wma": "audio/x-ms-wma",
  ".opus": "audio/opus",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
};

const EXTENSION_FROM_MIME: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/x-msvideo": ".avi",
  "video/quicktime": ".mov",
  "video/x-matroska": ".mkv",
  "video/x-flv": ".flv",
  "video/x-ms-wmv": ".wmv",
  "video/x-m4v": ".m4v",
  "video/3gpp": ".3gp",
  "video/mp2t": ".ts",
  "audio/mpeg": ".mp3",
  "audio/aac": ".aac",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/flac": ".flac",
  "audio/mp4": ".m4a",
  "audio/x-ms-wma": ".wma",
  "audio/opus": ".opus",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
};

export function getMimeTypeFromExtension(ext: string): string {
  const normalized = ext.startsWith(".")
    ? ext.toLowerCase()
    : `.${ext.toLowerCase()}`;
  return MIME_TYPE_MAP[normalized] || "application/octet-stream";
}

export function getExtensionFromMimeType(mimeType: string): string {
  return EXTENSION_FROM_MIME[mimeType.toLowerCase()] || "";
}

export function getInputExtension(binaryData: {
  fileName?: string;
  mimeType?: string;
  fileExtension?: string;
}): string {
  if (binaryData.fileExtension) {
    const ext = binaryData.fileExtension;
    return ext.startsWith(".") ? ext : `.${ext}`;
  }
  if (binaryData.fileName) {
    const lastDot = binaryData.fileName.lastIndexOf(".");
    if (lastDot !== -1) {
      return binaryData.fileName.substring(lastDot);
    }
  }
  if (binaryData.mimeType) {
    return getExtensionFromMimeType(binaryData.mimeType);
  }
  return "";
}

export function normalizeExtension(ext: string): string {
  if (!ext) return "";
  return ext.startsWith(".") ? ext : `.${ext}`;
}

const NAMED_COLORS: Record<string, string> = {
  white: "FFFFFF",
  black: "000000",
  red: "FF0000",
  green: "00FF00",
  blue: "0000FF",
  yellow: "FFFF00",
  cyan: "00FFFF",
  magenta: "FF00FF",
  orange: "FFA500",
  pink: "FFC0CB",
  gray: "808080",
  grey: "808080",
  purple: "800080",
};

/**
 * Converts a color name or hex string to ASS subtitle format (&H00BBGGRR&).
 * ASS uses BGR byte order, not RGB.
 */
export function colorToAssFormat(color: string): string {
  let hex = color.trim().toLowerCase();

  if (NAMED_COLORS[hex]) {
    hex = NAMED_COLORS[hex];
  } else if (hex.startsWith("#")) {
    hex = hex.substring(1);
  }

  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    hex = "FFFFFF";
  }

  const r = hex.substring(0, 2);
  const g = hex.substring(2, 4);
  const b = hex.substring(4, 6);
  return `&H00${b.toUpperCase()}${g.toUpperCase()}${r.toUpperCase()}&`;
}

/**
 * Builds chained atempo filters for speeds outside FFmpeg's 0.5-2.0 range.
 * E.g. 4x -> "atempo=2,atempo=2", 0.25x -> "atempo=0.5,atempo=0.5"
 */
export function buildAtempoFilter(speed: number): string {
  if (speed === 1) return "atempo=1";

  const filters: string[] = [];
  let remaining = speed;

  if (speed > 1) {
    while (remaining > 2) {
      filters.push("atempo=2");
      remaining /= 2;
    }
    if (remaining > 1) {
      filters.push(`atempo=${remaining}`);
    }
  } else {
    while (remaining < 0.5) {
      filters.push("atempo=0.5");
      remaining /= 0.5;
    }
    if (remaining < 1) {
      filters.push(`atempo=${remaining}`);
    }
  }

  return filters.length > 0 ? filters.join(",") : "atempo=1";
}

export interface MediaMetadata {
  duration?: string;
  durationSeconds?: number;
  bitrate?: string;
  videoCodec?: string;
  audioCodec?: string;
  width?: number;
  height?: number;
  fps?: number;
  sampleRate?: number;
  channels?: string;
  format?: string;
}

/**
 * Parses FFmpeg log output (from `-i input`) into structured metadata.
 */
export function parseMetadataFromLogs(logs: string): MediaMetadata {
  const metadata: MediaMetadata = {};

  const durationMatch = logs.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d+)/);
  if (durationMatch) {
    metadata.duration = durationMatch[1];
    const parts = durationMatch[1].split(":");
    metadata.durationSeconds =
      parseFloat(parts[0]) * 3600 +
      parseFloat(parts[1]) * 60 +
      parseFloat(parts[2]);
  }

  const bitrateMatch = logs.match(/bitrate:\s*(\d+)\s*kb\/s/);
  if (bitrateMatch) {
    metadata.bitrate = `${bitrateMatch[1]} kb/s`;
  }

  const videoMatch = logs.match(
    /Stream\s+#\d+:\d+.*Video:\s*(\w+)[^,]*,\s*\w+[^,]*,\s*(\d+)x(\d+)/,
  );
  if (videoMatch) {
    metadata.videoCodec = videoMatch[1];
    metadata.width = parseInt(videoMatch[2]);
    metadata.height = parseInt(videoMatch[3]);
  }

  const fpsMatch = logs.match(/(\d+(?:\.\d+)?)\s*fps/);
  if (fpsMatch) {
    metadata.fps = parseFloat(fpsMatch[1]);
  }

  const audioMatch = logs.match(
    /Stream\s+#\d+:\d+.*Audio:\s*(\w+)[^,]*,\s*(\d+)\s*Hz,\s*(\w+)/,
  );
  if (audioMatch) {
    metadata.audioCodec = audioMatch[1];
    metadata.sampleRate = parseInt(audioMatch[2]);
    metadata.channels = audioMatch[3];
  }

  const formatMatch = logs.match(/Input\s+#0,\s*(.+?),\s*from/);
  if (formatMatch) {
    metadata.format = formatMatch[1].trim();
  }

  return metadata;
}

export interface SocialMediaPreset {
  width: number;
  height: number;
  maxDuration?: number;
  videoBitrate: string;
  audioBitrate: string;
  fps: number;
}

export const SOCIAL_MEDIA_PRESETS: Record<string, SocialMediaPreset> = {
  youtube_1080p: {
    width: 1920,
    height: 1080,
    videoBitrate: "8000k",
    audioBitrate: "192k",
    fps: 30,
  },
  youtube_720p: {
    width: 1280,
    height: 720,
    videoBitrate: "5000k",
    audioBitrate: "128k",
    fps: 30,
  },
  youtube_shorts: {
    width: 1080,
    height: 1920,
    maxDuration: 60,
    videoBitrate: "6000k",
    audioBitrate: "128k",
    fps: 30,
  },
  instagram_feed: {
    width: 1080,
    height: 1080,
    maxDuration: 60,
    videoBitrate: "5000k",
    audioBitrate: "128k",
    fps: 30,
  },
  instagram_story: {
    width: 1080,
    height: 1920,
    maxDuration: 60,
    videoBitrate: "6000k",
    audioBitrate: "128k",
    fps: 30,
  },
  instagram_reels: {
    width: 1080,
    height: 1920,
    maxDuration: 90,
    videoBitrate: "6000k",
    audioBitrate: "128k",
    fps: 30,
  },
  tiktok: {
    width: 1080,
    height: 1920,
    maxDuration: 180,
    videoBitrate: "6000k",
    audioBitrate: "128k",
    fps: 30,
  },
  twitter: {
    width: 1280,
    height: 720,
    maxDuration: 140,
    videoBitrate: "5000k",
    audioBitrate: "128k",
    fps: 30,
  },
};
