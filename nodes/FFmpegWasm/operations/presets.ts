import { normalizeExtension, parseMetadataFromLogs, SOCIAL_MEDIA_PRESETS } from "../helpers";
import type { HandlerParams, CommandResult } from "../types";

export async function handleSocialMedia(
  p: HandlerParams,
): Promise<CommandResult> {
  const presetKey = p.ctx.getNodeParameter(
    "socialMediaPreset",
    p.i,
  ) as string;
  const preset = SOCIAL_MEDIA_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Unknown social media preset: ${presetKey}`);
  }

  const outputExt = ".mp4";
  const outputName = `${p.outputFilename}${outputExt}`;

  const command: string[] = [
    "-i", p.inputFilename,
    "-vf", `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`,
    "-r", preset.fps.toString(),
    "-c:v", "libx264", "-preset", p.preset,
    "-b:v", preset.videoBitrate,
    "-c:a", "aac",
    "-b:a", preset.audioBitrate,
    "-movflags", "+faststart",
  ];
  if (preset.maxDuration) {
    command.push("-t", preset.maxDuration.toString());
  }
  command.push("-y", outputName);

  return { command, outputExt, tempFiles: [] };
}

export async function handleCompressToSize(
  p: HandlerParams,
): Promise<CommandResult> {
  const targetSizeMB = p.ctx.getNodeParameter("targetSizeMB", p.i) as number;
  const compressAudioBitrate = p.ctx.getNodeParameter(
    "compressAudioBitrate",
    p.i,
  ) as string;
  const compressOutputFormat = p.ctx.getNodeParameter(
    "compressOutputFormat",
    p.i,
  ) as string;

  const outputExt = normalizeExtension(compressOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  // Run metadata probe
  p.resetLog();
  try {
    await Promise.race([
      p.ffmpeg.run("-i", p.inputFilename, "-hide_banner"),
      new Promise<void>((resolve) => setTimeout(resolve, 10000)),
    ]);
  } catch {
    // Expected: ffmpeg exits with error when no output is specified
  }
  const meta = parseMetadataFromLogs(p.getLog());
  const durationSec = meta.durationSeconds || 60;

  const audioBitrateKbps = parseInt(compressAudioBitrate) || 128;
  const targetBitsPerSec = (targetSizeMB * 8 * 1024 * 1024) / durationSec;
  const videoBitrate = Math.max(
    100,
    Math.floor(targetBitsPerSec / 1000 - audioBitrateKbps),
  );

  const command = [
    "-i", p.inputFilename,
    "-c:v", "libx264", "-preset", p.preset,
    "-b:v", `${videoBitrate}k`,
    "-maxrate", `${Math.floor(videoBitrate * 1.5)}k`,
    "-bufsize", `${videoBitrate * 2}k`,
    "-c:a", "aac",
    "-b:a", compressAudioBitrate,
    "-movflags", "+faststart",
    "-y", outputName,
  ];

  return { command, outputExt, tempFiles: [] };
}
