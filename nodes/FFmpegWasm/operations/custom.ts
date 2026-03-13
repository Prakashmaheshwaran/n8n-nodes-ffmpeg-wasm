import { normalizeExtension } from "../helpers";
import type { HandlerParams, CommandResult } from "../types";

const BLOCKED_PATTERNS = [/\.\.\//, /\/\.\.\//];

export async function handleCustom(
  p: HandlerParams,
): Promise<CommandResult> {
  const ffmpegArgs = p.ctx.getNodeParameter("ffmpegArgs", p.i) as string;
  const outputExtension = p.ctx.getNodeParameter(
    "outputExtension",
    p.i,
  ) as string;

  // Basic input validation
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(ffmpegArgs)) {
      throw new Error(
        "Custom FFmpeg arguments contain disallowed path traversal patterns",
      );
    }
  }

  const outputExt = normalizeExtension(outputExtension);
  const outputName = `${p.outputFilename}${outputExt}`;

  const argsString = ffmpegArgs
    .replace(/\binput\b/g, p.inputFilename)
    .replace(/\boutput\b/g, outputName);

  const command = argsString
    .split(/\s+/)
    .filter((arg) => arg.length > 0);

  return { command, outputExt, tempFiles: [] };
}
