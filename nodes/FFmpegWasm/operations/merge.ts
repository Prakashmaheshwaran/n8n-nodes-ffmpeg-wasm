import { getInputExtension, normalizeExtension } from "../helpers";
import type { HandlerParams, CommandResult } from "../types";

export async function handleMerge(
  p: HandlerParams,
): Promise<CommandResult> {
  const videoBinaryProperties = p.ctx.getNodeParameter(
    "videoBinaryProperties",
    p.i,
  ) as string;
  const mergeOutputFormat = p.ctx.getNodeParameter(
    "mergeOutputFormat",
    p.i,
  ) as string;
  const addTransition = p.ctx.getNodeParameter(
    "addTransition",
    p.i,
  ) as boolean;

  const binaryProps = videoBinaryProperties
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (binaryProps.length < 2) {
    throw new Error(
      "At least 2 video binary properties are required for merging",
    );
  }

  // Load all video buffers in parallel
  const buffers = await Promise.all(
    binaryProps.map((prop) => p.ctx.helpers.getBinaryDataBuffer(p.i, prop)),
  );

  const inputFiles: string[] = [];
  const tempFiles: string[] = [];
  for (let j = 0; j < binaryProps.length; j++) {
    const propBinary = p.items[p.i].binary?.[binaryProps[j]];
    const ext = propBinary ? getInputExtension(propBinary) : ".mp4";
    const inputName = `input_${p.i}_${j}_${Date.now()}${ext}`;
    p.ffmpeg.FS("writeFile", inputName, new Uint8Array(buffers[j]));
    inputFiles.push(inputName);
    tempFiles.push(inputName);
  }

  const concatList = inputFiles.map((f) => `file '${f}'`).join("\n");
  const listFilename = `list_${p.i}_${Date.now()}.txt`;
  p.ffmpeg.FS(
    "writeFile",
    listFilename,
    new TextEncoder().encode(concatList),
  );
  tempFiles.push(listFilename);

  const outputExt = normalizeExtension(mergeOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  let command: string[];
  if (addTransition) {
    command = [
      "-f", "concat", "-safe", "0",
      "-i", listFilename,
      "-vf", "fade=in:st=0:d=0.5,format=yuv420p",
      "-c:v", "libx264", "-preset", p.preset,
      "-y", outputName,
    ];
  } else {
    command = [
      "-f", "concat", "-safe", "0",
      "-i", listFilename,
      "-c", "copy",
      "-y", outputName,
    ];
  }

  return { command, outputExt, tempFiles };
}
