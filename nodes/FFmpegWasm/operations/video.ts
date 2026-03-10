import { normalizeExtension, buildAtempoFilter } from "../helpers";
import type { HandlerParams, CommandResult } from "../types";
import { isX264Format } from "../types";

export async function handleResize(
  p: HandlerParams,
): Promise<CommandResult> {
  const width = p.ctx.getNodeParameter("width", p.i) as number;
  const height = p.ctx.getNodeParameter("height", p.i) as number;
  const keepAspectRatio = p.ctx.getNodeParameter(
    "keepAspectRatio",
    p.i,
  ) as boolean;

  const outputExt = ".mp4";
  const outputName = `${p.outputFilename}${outputExt}`;
  const heightStr = keepAspectRatio ? "-1" : height.toString();

  const command = [
    "-i", p.inputFilename,
    "-vf", `scale=${width}:${heightStr}`,
    "-c:v", "libx264", "-preset", p.preset,
    "-c:a", "copy",
    "-y", outputName,
  ];

  return { command, outputExt, tempFiles: [] };
}

export async function handleThumbnail(
  p: HandlerParams,
): Promise<CommandResult> {
  const timestamp = p.ctx.getNodeParameter("timestamp", p.i) as string;
  const thumbnailWidth = p.ctx.getNodeParameter(
    "thumbnailWidth",
    p.i,
  ) as number;
  const thumbnailHeight = p.ctx.getNodeParameter(
    "thumbnailHeight",
    p.i,
  ) as number;

  const outputExt = ".jpg";
  const outputName = `${p.outputFilename}${outputExt}`;

  const command = [
    "-ss", timestamp,
    "-i", p.inputFilename,
    "-vframes", "1",
    "-q:v", "2",
    "-vf", `scale=${thumbnailWidth}:${thumbnailHeight}`,
    "-y", outputName,
  ];

  return { command, outputExt, tempFiles: [] };
}

export async function handleVideoFilters(
  p: HandlerParams,
): Promise<CommandResult> {
  const brightness = p.ctx.getNodeParameter("brightness", p.i) as number;
  const contrast = p.ctx.getNodeParameter("contrast", p.i) as number;
  const saturation = p.ctx.getNodeParameter("saturation", p.i) as number;
  const blur = p.ctx.getNodeParameter("blur", p.i) as number;
  const grayscale = p.ctx.getNodeParameter("grayscale", p.i) as boolean;
  const sepia = p.ctx.getNodeParameter("sepia", p.i) as boolean;
  const filtersOutputFormat = p.ctx.getNodeParameter(
    "filtersOutputFormat",
    p.i,
  ) as string;

  const vfFilters: string[] = [];

  const eqParts: string[] = [];
  if (brightness !== 0) eqParts.push(`brightness=${brightness}`);
  if (contrast !== 1) eqParts.push(`contrast=${contrast}`);
  if (saturation !== 1) eqParts.push(`saturation=${saturation}`);
  if (eqParts.length > 0) {
    vfFilters.push(`eq=${eqParts.join(":")}`);
  }

  if (blur > 0) vfFilters.push(`gblur=sigma=${blur}`);
  if (grayscale) vfFilters.push("format=gray");
  if (sepia) {
    vfFilters.push(
      "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    );
  }

  const outputExt = normalizeExtension(filtersOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  let command: string[];
  if (vfFilters.length > 0) {
    command = ["-i", p.inputFilename, "-vf", vfFilters.join(",")];
    if (isX264Format(outputExt)) {
      command.push("-c:v", "libx264", "-preset", p.preset);
    }
    command.push("-c:a", "copy", "-y", outputName);
  } else {
    command = ["-i", p.inputFilename, "-c", "copy", "-y", outputName];
  }

  return { command, outputExt, tempFiles: [] };
}

export async function handleSpeed(
  p: HandlerParams,
): Promise<CommandResult> {
  const speedValue = p.ctx.getNodeParameter("speedValue", p.i) as string;
  const adjustAudioPitch = p.ctx.getNodeParameter(
    "adjustAudioPitch",
    p.i,
  ) as boolean;
  const speedOutputFormat = p.ctx.getNodeParameter(
    "speedOutputFormat",
    p.i,
  ) as string;

  const speed = parseFloat(speedValue);
  const outputExt = normalizeExtension(speedOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;
  const videoFilter = `setpts=${1 / speed}*PTS`;

  const command: string[] = ["-i", p.inputFilename, "-vf", videoFilter];

  if (isX264Format(outputExt)) {
    command.push("-c:v", "libx264", "-preset", p.preset);
  }

  if (adjustAudioPitch) {
    const audioFilter = buildAtempoFilter(speed);
    command.push("-af", audioFilter);
  } else {
    command.push("-an");
  }
  command.push("-y", outputName);

  return { command, outputExt, tempFiles: [] };
}

export async function handleRotate(
  p: HandlerParams,
): Promise<CommandResult> {
  const rotation = p.ctx.getNodeParameter("rotation", p.i) as string;
  const flipHorizontal = p.ctx.getNodeParameter(
    "flipHorizontal",
    p.i,
  ) as boolean;
  const flipVertical = p.ctx.getNodeParameter(
    "flipVertical",
    p.i,
  ) as boolean;
  const rotateOutputFormat = p.ctx.getNodeParameter(
    "rotateOutputFormat",
    p.i,
  ) as string;

  const vfParts: string[] = [];
  switch (rotation) {
    case "90":
      vfParts.push("transpose=1");
      break;
    case "270":
      vfParts.push("transpose=2");
      break;
    case "180":
      vfParts.push("transpose=1");
      vfParts.push("transpose=1");
      break;
    case "0":
    default:
      break;
  }
  if (flipHorizontal) vfParts.push("hflip");
  if (flipVertical) vfParts.push("vflip");

  const outputExt = normalizeExtension(rotateOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  let command: string[];
  if (vfParts.length > 0) {
    command = ["-i", p.inputFilename, "-vf", vfParts.join(",")];
    if (isX264Format(outputExt)) {
      command.push("-c:v", "libx264", "-preset", p.preset);
    }
    command.push("-c:a", "copy", "-y", outputName);
  } else {
    command = ["-i", p.inputFilename, "-c", "copy", "-y", outputName];
  }

  return { command, outputExt, tempFiles: [] };
}
