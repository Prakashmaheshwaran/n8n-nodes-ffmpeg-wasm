import {
  getInputExtension,
  normalizeExtension,
  colorToAssFormat,
  getMimeTypeFromExtension,
} from "../helpers";
import type {
  HandlerParams,
  CommandResult,
  ImageSequenceOutput,
} from "../types";
import { isX264Format } from "../types";

export async function handleOverlay(
  p: HandlerParams,
): Promise<CommandResult> {
  const overlayBinaryProperty = p.ctx.getNodeParameter(
    "overlayBinaryProperty",
    p.i,
  ) as string;
  const overlayType = p.ctx.getNodeParameter("overlayType", p.i) as string;
  const overlayX = p.ctx.getNodeParameter("overlayX", p.i) as string;
  const overlayY = p.ctx.getNodeParameter("overlayY", p.i) as string;
  const overlayWidth = p.ctx.getNodeParameter("overlayWidth", p.i) as number;
  const overlayHeight = p.ctx.getNodeParameter(
    "overlayHeight",
    p.i,
  ) as number;
  const overlayOpacity = p.ctx.getNodeParameter(
    "overlayOpacity",
    p.i,
  ) as number;
  const overlayOutputFormat = p.ctx.getNodeParameter(
    "overlayOutputFormat",
    p.i,
  ) as string;

  const overlayBin = p.items[p.i].binary?.[overlayBinaryProperty];
  const overlayExt = overlayBin ? getInputExtension(overlayBin) : ".png";
  const overlayData = await p.ctx.helpers.getBinaryDataBuffer(
    p.i,
    overlayBinaryProperty,
  );
  const overlayFilename = `overlay_${p.i}_${Date.now()}${overlayExt}`;
  p.ffmpeg.FS("writeFile", overlayFilename, new Uint8Array(overlayData));

  const outputExt = normalizeExtension(overlayOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  let videoFilter = "";
  if (overlayWidth > 0 || overlayHeight > 0) {
    const wStr = overlayWidth > 0 ? overlayWidth.toString() : "-1";
    const hStr = overlayHeight > 0 ? overlayHeight.toString() : "-1";
    videoFilter = `[1:v]scale=${wStr}:${hStr}`;
    if (overlayOpacity < 1.0) {
      videoFilter += `,format=rgba,colorchannelmixer=aa=${overlayOpacity}`;
    }
    videoFilter += `[ovrl];[0:v][ovrl]overlay=${overlayX}:${overlayY}[outv]`;
  } else {
    if (overlayOpacity < 1.0) {
      videoFilter = `[1:v]format=rgba,colorchannelmixer=aa=${overlayOpacity}[ovrl];[0:v][ovrl]overlay=${overlayX}:${overlayY}[outv]`;
    } else {
      videoFilter = `[0:v][1:v]overlay=${overlayX}:${overlayY}[outv]`;
    }
  }

  let command: string[];
  if (overlayType === "pip") {
    const fullFilter = `${videoFilter};[0:a][1:a]amix=inputs=2:duration=first[outa]`;
    command = [
      "-i", p.inputFilename,
      "-i", overlayFilename,
      "-filter_complex", fullFilter,
      "-map", "[outv]",
      "-map", "[outa]",
    ];
  } else {
    command = [
      "-i", p.inputFilename,
      "-i", overlayFilename,
      "-filter_complex", videoFilter,
      "-map", "[outv]",
      "-map", "0:a?",
      "-c:a", "copy",
    ];
  }

  if (isX264Format(outputExt)) {
    command.push("-c:v", "libx264", "-preset", p.preset);
  }
  command.push("-y", outputName);

  return { command, outputExt, tempFiles: [overlayFilename] };
}

export async function handleSubtitle(
  p: HandlerParams,
): Promise<CommandResult> {
  const subtitleBinaryProperty = p.ctx.getNodeParameter(
    "subtitleBinaryProperty",
    p.i,
  ) as string;
  const subtitleFormat = p.ctx.getNodeParameter(
    "subtitleFormat",
    p.i,
  ) as string;
  const subtitleFontSize = p.ctx.getNodeParameter(
    "subtitleFontSize",
    p.i,
  ) as number;
  const subtitleFontColor = p.ctx.getNodeParameter(
    "subtitleFontColor",
    p.i,
  ) as string;
  const subtitleBgOpacity = p.ctx.getNodeParameter(
    "subtitleBgOpacity",
    p.i,
  ) as number;
  const subtitlePosition = p.ctx.getNodeParameter(
    "subtitlePosition",
    p.i,
  ) as string;
  const subtitleOutputFormat = p.ctx.getNodeParameter(
    "subtitleOutputFormat",
    p.i,
  ) as string;

  const subtitleData = await p.ctx.helpers.getBinaryDataBuffer(
    p.i,
    subtitleBinaryProperty,
  );
  const subtitleFilename = `subtitle_${p.i}_${Date.now()}.${subtitleFormat}`;
  p.ffmpeg.FS(
    "writeFile",
    subtitleFilename,
    new Uint8Array(subtitleData),
  );

  const outputExt = normalizeExtension(subtitleOutputFormat);
  const outputName = `${p.outputFilename}${outputExt}`;

  const assColor = colorToAssFormat(subtitleFontColor);

  let alignment = "2";
  if (subtitlePosition === "top") {
    alignment = "6";
  } else if (subtitlePosition === "center") {
    alignment = "5";
  }

  let subtitleFilter = "";
  if (subtitleBgOpacity > 0) {
    const alphaHex = Math.round(subtitleBgOpacity * 255)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    subtitleFilter = `subtitles=${subtitleFilename}:force_style='FontSize=${subtitleFontSize},PrimaryColour=${assColor},Alignment=${alignment},OutlineColour=&H00000000&,Outline=1,BorderStyle=4,BackColour=&H${alphaHex}000000&'`;
  } else {
    subtitleFilter = `subtitles=${subtitleFilename}:force_style='FontSize=${subtitleFontSize},PrimaryColour=${assColor},Alignment=${alignment}'`;
  }

  const command: string[] = ["-i", p.inputFilename, "-vf", subtitleFilter];
  if (isX264Format(outputExt)) {
    command.push("-c:v", "libx264", "-preset", p.preset);
  }
  command.push("-c:a", "copy", "-y", outputName);

  return { command, outputExt, tempFiles: [subtitleFilename] };
}

export async function handleGif(
  p: HandlerParams,
): Promise<CommandResult> {
  const gifOutputFormat = p.ctx.getNodeParameter(
    "gifOutputFormat",
    p.i,
  ) as string;
  const gifWidth = p.ctx.getNodeParameter("gifWidth", p.i) as number;
  const gifHeight = p.ctx.getNodeParameter("gifHeight", p.i) as number;
  const gifFps = p.ctx.getNodeParameter("gifFps", p.i) as number;
  const gifStartTime = p.ctx.getNodeParameter(
    "gifStartTime",
    p.i,
  ) as string;
  const gifDuration = p.ctx.getNodeParameter("gifDuration", p.i) as string;
  const gifColors = p.ctx.getNodeParameter("gifColors", p.i) as number;
  const gifDither = p.ctx.getNodeParameter("gifDither", p.i) as string;
  const gifLoop = p.ctx.getNodeParameter("gifLoop", p.i) as boolean;

  const outputExt = `.${gifOutputFormat}`;
  const outputName = `${p.outputFilename}${outputExt}`;

  const wStr = gifWidth > 0 ? gifWidth.toString() : "-1";
  const hStr = gifHeight > 0 ? gifHeight.toString() : "-1";
  const scaleFilter = `fps=${gifFps},scale=${wStr}:${hStr}:flags=lanczos`;

  let command: string[];
  if (gifOutputFormat === "gif") {
    const loopValue = gifLoop ? "0" : "-1";
    const gifFilter = `[0:v]${scaleFilter},split[s0][s1];[s0]palettegen=max_colors=${gifColors}[p];[s1][p]paletteuse=dither=${gifDither}`;
    command = [
      "-ss", gifStartTime,
      "-t", gifDuration,
      "-i", p.inputFilename,
      "-filter_complex", gifFilter,
      "-loop", loopValue,
      "-y", outputName,
    ];
  } else {
    const loopValue = gifLoop ? "0" : "1";
    command = [
      "-ss", gifStartTime,
      "-t", gifDuration,
      "-i", p.inputFilename,
      "-vf", scaleFilter,
      "-loop", loopValue,
      "-y", outputName,
    ];
  }

  return { command, outputExt, tempFiles: [] };
}

export async function handleImageSequence(
  p: HandlerParams,
): Promise<ImageSequenceOutput> {
  const sequenceOutputFormat = p.ctx.getNodeParameter(
    "sequenceOutputFormat",
    p.i,
  ) as string;
  const sequenceWidth = p.ctx.getNodeParameter(
    "sequenceWidth",
    p.i,
  ) as number;
  const sequenceHeight = p.ctx.getNodeParameter(
    "sequenceHeight",
    p.i,
  ) as number;
  const sequenceFps = p.ctx.getNodeParameter("sequenceFps", p.i) as number;
  const sequenceStartTime = p.ctx.getNodeParameter(
    "sequenceStartTime",
    p.i,
  ) as string;
  const sequenceDuration = p.ctx.getNodeParameter(
    "sequenceDuration",
    p.i,
  ) as string;
  const sequenceQuality = p.ctx.getNodeParameter(
    "sequenceQuality",
    p.i,
  ) as number;

  const outputPattern = `frame_%04d.${sequenceOutputFormat}`;

  const wStr = sequenceWidth > 0 ? sequenceWidth.toString() : "-1";
  const hStr = sequenceHeight > 0 ? sequenceHeight.toString() : "-1";
  const vfFilter = `fps=1/${sequenceFps},scale=${wStr}:${hStr}`;

  const cmdArgs: string[] = ["-ss", sequenceStartTime];
  if (sequenceDuration && sequenceDuration.length > 0) {
    cmdArgs.push("-t", sequenceDuration);
  }
  cmdArgs.push("-i", p.inputFilename, "-vf", vfFilter);

  if (sequenceOutputFormat === "jpg" || sequenceOutputFormat === "jpeg") {
    cmdArgs.push(
      "-q:v",
      Math.round(((100 - sequenceQuality) / 100) * 31).toString(),
    );
  } else if (sequenceOutputFormat === "webp") {
    cmdArgs.push("-q:v", sequenceQuality.toString());
  }

  cmdArgs.push("-y", outputPattern);

  return {
    command: cmdArgs,
    outputFormat: sequenceOutputFormat,
    tempFiles: [],
  };
}

export function readImageSequenceFrames(
  ffmpeg: HandlerParams["ffmpeg"],
  outputFormat: string,
  outputBinaryPropertyName: string,
  itemJson: Record<string, unknown>,
  binaryFileName: string,
): import("n8n-workflow").INodeExecutionData[] {
  const mimeType = getMimeTypeFromExtension(outputFormat);
  const results: import("n8n-workflow").INodeExecutionData[] = [];
  let frameIndex = 1;

  while (true) {
    const frameName = `frame_${String(frameIndex).padStart(4, "0")}.${outputFormat}`;
    try {
      const frameData = ffmpeg.FS("readFile", frameName) as Uint8Array;
      results.push({
        json: {
          ...itemJson,
          ffmpeg: {
            operation: "imageSequence",
            inputFilename: binaryFileName,
            outputFilename: frameName,
            frameIndex,
            size: frameData.length,
          },
        },
        binary: {
          [outputBinaryPropertyName]: {
            data: Buffer.from(frameData).toString("base64"),
            fileName: frameName,
            mimeType,
          },
        },
      });
      try {
        ffmpeg.FS("unlink", frameName);
      } catch {}
      frameIndex++;
    } catch {
      break;
    }
  }

  return results;
}
