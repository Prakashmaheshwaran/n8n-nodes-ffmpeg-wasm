import { parseMetadataFromLogs } from "../helpers";
import type { HandlerParams, MetadataOutput } from "../types";

export async function handleMetadata(
  p: HandlerParams,
): Promise<MetadataOutput> {
  p.resetLog();
  try {
    await Promise.race([
      p.ffmpeg.run("-i", p.inputFilename, "-hide_banner"),
      new Promise<void>((resolve) => setTimeout(resolve, 10000)),
    ]);
  } catch {
    // Expected: ffmpeg exits with error when no output is specified
  }
  const metadata = parseMetadataFromLogs(p.getLog());

  return { metadata, tempFiles: [] };
}
