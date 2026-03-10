import { normalizeExtension } from "../helpers";
import type { HandlerParams, CommandResult } from "../types";
import { isX264Format } from "../types";

export async function handleConvert(
  p: HandlerParams,
): Promise<CommandResult> {
  const outputFormat = p.ctx.getNodeParameter("outputFormat", p.i) as string;
  const videoCodec = p.ctx.getNodeParameter("videoCodec", p.i) as string;
  const audioCodec = p.ctx.getNodeParameter("audioCodec", p.i) as string;
  const crf = p.ctx.getNodeParameter("crf", p.i) as number;

  const outputExt = normalizeExtension(outputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  const command: string[] = ["-i", p.inputFilename];
  if (videoCodec !== "auto") {
    command.push("-c:v", videoCodec);
    if (videoCodec === "libx264" || videoCodec === "libx265") {
      command.push("-preset", p.preset);
    }
  } else if (isX264Format(outputExt)) {
    command.push("-c:v", "libx264", "-preset", p.preset);
  }
  if (audioCodec !== "auto") {
    command.push("-c:a", audioCodec);
  }
  if (crf >= 0) {
    command.push("-crf", crf.toString());
  }
  command.push("-y", outputName);

  return { command, outputExt, tempFiles: [] };
}

export async function handleRemux(
  p: HandlerParams,
): Promise<CommandResult> {
  const remuxOutputFormat = p.ctx.getNodeParameter(
    "remuxOutputFormat",
    p.i,
  ) as string;
  const outputExt = normalizeExtension(remuxOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  const command = ["-i", p.inputFilename, "-c", "copy", "-y", outputName];

  return { command, outputExt, tempFiles: [] };
}
