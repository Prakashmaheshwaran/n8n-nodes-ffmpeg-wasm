import { getInputExtension, normalizeExtension } from "../helpers";
import type { HandlerParams, CommandResult } from "../types";

export async function handleExtractAudio(
  p: HandlerParams,
): Promise<CommandResult> {
  const audioFormat = p.ctx.getNodeParameter("audioFormat", p.i) as string;
  const audioQuality = p.ctx.getNodeParameter("audioQuality", p.i) as string;
  const outputExt = `.${audioFormat}`;
  const outputName = `${p.outputFilename}${outputExt}`;

  const command = [
    "-i", p.inputFilename,
    "-vn", "-ar", "44100", "-ac", "2",
    "-b:a", audioQuality,
    "-y", outputName,
  ];

  return { command, outputExt, tempFiles: [] };
}

export async function handleAudioMix(
  p: HandlerParams,
): Promise<CommandResult> {
  const audioBinaryProperties = p.ctx.getNodeParameter(
    "audioBinaryProperties",
    p.i,
  ) as string;
  const audioMixOutputFormat = p.ctx.getNodeParameter(
    "audioMixOutputFormat",
    p.i,
  ) as string;

  const binaryProps = audioBinaryProperties
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (binaryProps.length < 2) {
    throw new Error(
      "At least 2 audio binary properties are required for mixing",
    );
  }

  // Load all audio buffers in parallel
  const buffers = await Promise.all(
    binaryProps.map((prop) => p.ctx.helpers.getBinaryDataBuffer(p.i, prop)),
  );

  const inputFiles: string[] = [];
  const tempFiles: string[] = [];
  for (let j = 0; j < binaryProps.length; j++) {
    const propBinary = p.items[p.i].binary?.[binaryProps[j]];
    const ext = propBinary ? getInputExtension(propBinary) : ".wav";
    const inputName = `audio_input_${p.i}_${j}_${Date.now()}${ext}`;
    p.ffmpeg.FS("writeFile", inputName, new Uint8Array(buffers[j]));
    inputFiles.push(inputName);
    tempFiles.push(inputName);
  }

  const outputExt = normalizeExtension(audioMixOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  const filterComplex =
    inputFiles.map((_f, idx) => `[${idx}:a]`).join("") +
    `amix=inputs=${inputFiles.length}:duration=longest[aout]`;

  const inputs: string[] = [];
  for (const f of inputFiles) {
    inputs.push("-i", f);
  }

  const command = [
    ...inputs,
    "-filter_complex", filterComplex,
    "-map", "[aout]",
    "-y", outputName,
  ];

  return { command, outputExt, tempFiles };
}

export async function handleAudioFilters(
  p: HandlerParams,
): Promise<CommandResult> {
  const volume = p.ctx.getNodeParameter("volume", p.i) as number;
  const bassBoost = p.ctx.getNodeParameter("bassBoost", p.i) as number;
  const trebleBoost = p.ctx.getNodeParameter("trebleBoost", p.i) as number;
  const highPass = p.ctx.getNodeParameter("highPass", p.i) as number;
  const lowPass = p.ctx.getNodeParameter("lowPass", p.i) as number;
  const audioFiltersOutputFormat = p.ctx.getNodeParameter(
    "audioFiltersOutputFormat",
    p.i,
  ) as string;

  const afFilters: string[] = [];
  if (volume !== 1.0) afFilters.push(`volume=${volume}`);
  if (bassBoost > 0) afFilters.push(`bass=g=${bassBoost}`);
  if (trebleBoost > 0) afFilters.push(`treble=g=${trebleBoost}`);
  if (highPass > 0) afFilters.push(`highpass=f=${highPass}`);
  if (lowPass > 0) afFilters.push(`lowpass=f=${lowPass}`);

  const outputExt = normalizeExtension(audioFiltersOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  let command: string[];
  if (afFilters.length > 0) {
    command = [
      "-i", p.inputFilename,
      "-af", afFilters.join(","),
      "-y", outputName,
    ];
  } else {
    command = [
      "-i", p.inputFilename,
      "-c:a", "copy",
      "-y", outputName,
    ];
  }

  return { command, outputExt, tempFiles: [] };
}

export async function handleAudioNormalize(
  p: HandlerParams,
): Promise<CommandResult> {
  const targetLoudness = p.ctx.getNodeParameter(
    "targetLoudness",
    p.i,
  ) as number;
  const truePeak = p.ctx.getNodeParameter("truePeak", p.i) as number;
  const audioNormalizeOutputFormat = p.ctx.getNodeParameter(
    "audioNormalizeOutputFormat",
    p.i,
  ) as string;

  const outputExt = normalizeExtension(audioNormalizeOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  const command = [
    "-i", p.inputFilename,
    "-af", `loudnorm=I=${targetLoudness}:TP=${truePeak}:LRA=11`,
    "-y", outputName,
  ];

  return { command, outputExt, tempFiles: [] };
}
