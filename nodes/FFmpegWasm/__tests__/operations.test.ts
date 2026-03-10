/**
 * Comprehensive tests for all FFmpeg WASM operation handlers.
 *
 * Each operation is tested for:
 *   - Correct FFmpeg command construction
 *   - Proper output extension
 *   - Encoding preset applied where expected
 *   - Temp file tracking for cleanup
 *   - Edge-case parameter handling
 */

import type { HandlerParams, FFmpegInstance } from "../types";
import { isX264Format } from "../types";
import {
  handleConvert,
  handleRemux,
  handleExtractAudio,
  handleAudioMix,
  handleAudioFilters,
  handleAudioNormalize,
  handleResize,
  handleThumbnail,
  handleVideoFilters,
  handleSpeed,
  handleRotate,
  handleMerge,
  handleOverlay,
  handleSubtitle,
  handleGif,
  handleImageSequence,
  readImageSequenceFrames,
  handleSocialMedia,
  handleCompressToSize,
  handleMetadata,
  handleCustom,
} from "../operations";

// ── Mocks ─────────────────────────────────────────────────────────

function createMockFFmpeg(): FFmpegInstance {
  const files = new Map<string, Uint8Array>();
  return {
    load: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockResolvedValue(undefined),
    FS: jest.fn((method: string, ...args: unknown[]) => {
      if (method === "writeFile") {
        files.set(args[0] as string, args[1] as Uint8Array);
      } else if (method === "readFile") {
        const name = args[0] as string;
        if (files.has(name)) return files.get(name)!;
        throw new Error(`File not found: ${name}`);
      } else if (method === "unlink") {
        files.delete(args[0] as string);
      }
      return undefined;
    }),
    exit: jest.fn(),
    isLoaded: jest.fn().mockReturnValue(true),
  };
}

function createMockContext(paramOverrides: Record<string, unknown> = {}) {
  const params: Record<string, unknown> = { ...paramOverrides };
  return {
    getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) => {
      if (name in params) return params[name];
      if (fallback !== undefined) return fallback;
      return "";
    }),
    helpers: {
      getBinaryDataBuffer: jest.fn().mockResolvedValue(Buffer.from("fake-data")),
    },
    getCredentials: jest.fn(),
    getInputData: jest.fn(),
    continueOnFail: jest.fn().mockReturnValue(false),
  };
}

function makeParams(
  overrides: Partial<HandlerParams> & { paramOverrides?: Record<string, unknown> } = {},
): HandlerParams {
  const { paramOverrides = {}, ...rest } = overrides;
  const ffmpeg = overrides.ffmpeg || createMockFFmpeg();
  const logLines: string[] = [];
  return {
    ctx: createMockContext(paramOverrides) as unknown as HandlerParams["ctx"],
    ffmpeg,
    i: 0,
    inputFilename: "input_0_123456.mp4",
    outputFilename: "output_0_123456",
    items: [
      {
        json: {},
        binary: {
          data: {
            data: "",
            mimeType: "video/mp4",
            fileName: "test.mp4",
          },
        },
      },
    ] as unknown as HandlerParams["items"],
    preset: "ultrafast",
    getLog: () => logLines.join("\n"),
    resetLog: () => { logLines.length = 0; },
    ...rest,
  };
}

// ── isX264Format ──────────────────────────────────────────────────

describe("isX264Format", () => {
  it("returns true for common x264-compatible formats", () => {
    expect(isX264Format(".mp4")).toBe(true);
    expect(isX264Format(".mkv")).toBe(true);
    expect(isX264Format(".mov")).toBe(true);
    expect(isX264Format(".avi")).toBe(true);
    expect(isX264Format(".ts")).toBe(true);
    expect(isX264Format(".flv")).toBe(true);
  });

  it("returns false for non-x264 formats", () => {
    expect(isX264Format(".webm")).toBe(false);
    expect(isX264Format(".gif")).toBe(false);
    expect(isX264Format(".ogg")).toBe(false);
    expect(isX264Format(".mp3")).toBe(false);
  });

  it("is case insensitive", () => {
    expect(isX264Format(".MP4")).toBe(true);
    expect(isX264Format(".MKV")).toBe(true);
  });
});

// ── Convert ───────────────────────────────────────────────────────

describe("handleConvert", () => {
  it("builds basic convert command with auto codecs", async () => {
    const p = makeParams({
      paramOverrides: {
        outputFormat: "webm",
        videoCodec: "auto",
        audioCodec: "auto",
        crf: -1,
      },
    });
    const result = await handleConvert(p);

    expect(result.outputExt).toBe(".webm");
    expect(result.command).toContain("-i");
    expect(result.command).toContain(p.inputFilename);
    expect(result.command).toContain("-y");
    expect(result.tempFiles).toEqual([]);
  });

  it("applies preset when libx264 codec is selected", async () => {
    const p = makeParams({
      paramOverrides: {
        outputFormat: "mp4",
        videoCodec: "libx264",
        audioCodec: "auto",
        crf: 23,
      },
    });
    const result = await handleConvert(p);

    expect(result.command).toContain("-c:v");
    expect(result.command).toContain("libx264");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
    expect(result.command).toContain("-crf");
    expect(result.command).toContain("23");
  });

  it("applies preset when libx265 codec is selected", async () => {
    const p = makeParams({
      paramOverrides: {
        outputFormat: "mp4",
        videoCodec: "libx265",
        audioCodec: "auto",
        crf: -1,
      },
    });
    const result = await handleConvert(p);

    expect(result.command).toContain("libx265");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
  });

  it("applies preset when auto codec with x264-compatible format", async () => {
    const p = makeParams({
      paramOverrides: {
        outputFormat: "mp4",
        videoCodec: "auto",
        audioCodec: "auto",
        crf: -1,
      },
    });
    const result = await handleConvert(p);

    expect(result.command).toContain("libx264");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
  });

  it("does NOT apply x264 preset for VP9 codec", async () => {
    const p = makeParams({
      paramOverrides: {
        outputFormat: "webm",
        videoCodec: "libvpx-vp9",
        audioCodec: "auto",
        crf: -1,
      },
    });
    const result = await handleConvert(p);

    expect(result.command).toContain("libvpx-vp9");
    expect(result.command).not.toContain("-preset");
  });

  it("sets explicit audio codec when not auto", async () => {
    const p = makeParams({
      paramOverrides: {
        outputFormat: "mp4",
        videoCodec: "auto",
        audioCodec: "aac",
        crf: -1,
      },
    });
    const result = await handleConvert(p);

    expect(result.command).toContain("-c:a");
    expect(result.command).toContain("aac");
  });

  it("skips CRF when set to -1", async () => {
    const p = makeParams({
      paramOverrides: {
        outputFormat: "mp4",
        videoCodec: "auto",
        audioCodec: "auto",
        crf: -1,
      },
    });
    const result = await handleConvert(p);

    expect(result.command).not.toContain("-crf");
  });

  it("uses custom preset value", async () => {
    const p = makeParams({
      preset: "medium",
      paramOverrides: {
        outputFormat: "mp4",
        videoCodec: "libx264",
        audioCodec: "auto",
        crf: -1,
      },
    });
    const result = await handleConvert(p);

    expect(result.command).toContain("-preset");
    expect(result.command).toContain("medium");
  });
});

// ── Remux ─────────────────────────────────────────────────────────

describe("handleRemux", () => {
  it("builds remux command with -c copy", async () => {
    const p = makeParams({
      paramOverrides: { remuxOutputFormat: "mkv" },
    });
    const result = await handleRemux(p);

    expect(result.outputExt).toBe(".mkv");
    expect(result.command).toContain("-c");
    expect(result.command).toContain("copy");
    expect(result.command).not.toContain("-preset");
    expect(result.tempFiles).toEqual([]);
  });
});

// ── Extract Audio ─────────────────────────────────────────────────

describe("handleExtractAudio", () => {
  it("builds extract audio command", async () => {
    const p = makeParams({
      paramOverrides: { audioFormat: "mp3", audioQuality: "192k" },
    });
    const result = await handleExtractAudio(p);

    expect(result.outputExt).toBe(".mp3");
    expect(result.command).toContain("-vn");
    expect(result.command).toContain("-ar");
    expect(result.command).toContain("44100");
    expect(result.command).toContain("-b:a");
    expect(result.command).toContain("192k");
    expect(result.command).not.toContain("-preset");
  });

  it("supports different formats", async () => {
    const p = makeParams({
      paramOverrides: { audioFormat: "wav", audioQuality: "320k" },
    });
    const result = await handleExtractAudio(p);

    expect(result.outputExt).toBe(".wav");
    expect(result.command).toContain("320k");
  });
});

// ── Audio Mix ─────────────────────────────────────────────────────

describe("handleAudioMix", () => {
  it("loads files in parallel and builds filter_complex", async () => {
    const ffmpeg = createMockFFmpeg();
    const ctx = createMockContext({
      audioBinaryProperties: "audio1,audio2,audio3",
      audioMixOutputFormat: "mp3",
    });
    ctx.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(Buffer.from("audio"));

    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        audioBinaryProperties: "audio1,audio2,audio3",
        audioMixOutputFormat: "mp3",
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("audio"));

    p.items = [{
      json: {},
      binary: {
        audio1: { data: "", mimeType: "audio/wav", fileName: "a1.wav" },
        audio2: { data: "", mimeType: "audio/wav", fileName: "a2.wav" },
        audio3: { data: "", mimeType: "audio/wav", fileName: "a3.wav" },
      },
    }] as unknown as HandlerParams["items"];

    const result = await handleAudioMix(p);

    expect(result.outputExt).toBe(".mp3");
    expect(result.command).toContain("-filter_complex");
    expect(result.tempFiles.length).toBe(3);

    // Verify parallel loading (all 3 calls made)
    const mockGetBuffer = (p.ctx as unknown as ReturnType<typeof createMockContext>)
      .helpers.getBinaryDataBuffer;
    expect(mockGetBuffer).toHaveBeenCalledTimes(3);
  });

  it("throws when less than 2 properties", async () => {
    const p = makeParams({
      paramOverrides: {
        audioBinaryProperties: "audio1",
        audioMixOutputFormat: "mp3",
      },
    });

    await expect(handleAudioMix(p)).rejects.toThrow(
      "At least 2 audio binary properties are required",
    );
  });
});

// ── Audio Filters ─────────────────────────────────────────────────

describe("handleAudioFilters", () => {
  it("builds filter chain with all filters", async () => {
    const p = makeParams({
      paramOverrides: {
        volume: 2.0,
        bassBoost: 5,
        trebleBoost: 3,
        highPass: 200,
        lowPass: 8000,
        audioFiltersOutputFormat: "mp3",
      },
    });
    const result = await handleAudioFilters(p);

    expect(result.outputExt).toBe(".mp3");
    expect(result.command).toContain("-af");
    const afIdx = result.command.indexOf("-af");
    const filterStr = result.command[afIdx + 1];
    expect(filterStr).toContain("volume=2");
    expect(filterStr).toContain("bass=g=5");
    expect(filterStr).toContain("treble=g=3");
    expect(filterStr).toContain("highpass=f=200");
    expect(filterStr).toContain("lowpass=f=8000");
  });

  it("uses -c:a copy when no filters applied", async () => {
    const p = makeParams({
      paramOverrides: {
        volume: 1.0,
        bassBoost: 0,
        trebleBoost: 0,
        highPass: 0,
        lowPass: 0,
        audioFiltersOutputFormat: "mp3",
      },
    });
    const result = await handleAudioFilters(p);

    expect(result.command).toContain("-c:a");
    expect(result.command).toContain("copy");
    expect(result.command).not.toContain("-af");
  });
});

// ── Audio Normalize ───────────────────────────────────────────────

describe("handleAudioNormalize", () => {
  it("builds loudnorm filter", async () => {
    const p = makeParams({
      paramOverrides: {
        targetLoudness: -14,
        truePeak: -1,
        audioNormalizeOutputFormat: "mp3",
      },
    });
    const result = await handleAudioNormalize(p);

    expect(result.outputExt).toBe(".mp3");
    expect(result.command).toContain("-af");
    const afIdx = result.command.indexOf("-af");
    expect(result.command[afIdx + 1]).toContain("loudnorm=I=-14:TP=-1:LRA=11");
  });
});

// ── Resize ────────────────────────────────────────────────────────

describe("handleResize", () => {
  it("builds resize command with aspect ratio", async () => {
    const p = makeParams({
      paramOverrides: {
        width: 1920,
        height: 1080,
        keepAspectRatio: true,
      },
    });
    const result = await handleResize(p);

    expect(result.outputExt).toBe(".mp4");
    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("scale=1920:-1");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
  });

  it("uses exact dimensions when keepAspectRatio is false", async () => {
    const p = makeParams({
      paramOverrides: {
        width: 640,
        height: 480,
        keepAspectRatio: false,
      },
    });
    const result = await handleResize(p);

    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("scale=640:480");
  });
});

// ── Thumbnail ─────────────────────────────────────────────────────

describe("handleThumbnail", () => {
  it("builds thumbnail extraction command", async () => {
    const p = makeParams({
      paramOverrides: {
        timestamp: "00:00:05",
        thumbnailWidth: 320,
        thumbnailHeight: 240,
      },
    });
    const result = await handleThumbnail(p);

    expect(result.outputExt).toBe(".jpg");
    expect(result.command).toContain("-ss");
    expect(result.command).toContain("00:00:05");
    expect(result.command).toContain("-vframes");
    expect(result.command).toContain("1");
    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("scale=320:240");
    expect(result.command).not.toContain("-preset");
  });
});

// ── Video Filters ─────────────────────────────────────────────────

describe("handleVideoFilters", () => {
  it("builds eq filter with all adjustments", async () => {
    const p = makeParams({
      paramOverrides: {
        brightness: 0.5,
        contrast: 1.5,
        saturation: 1.2,
        blur: 0,
        grayscale: false,
        sepia: false,
        filtersOutputFormat: "mp4",
      },
    });
    const result = await handleVideoFilters(p);

    expect(result.outputExt).toBe(".mp4");
    const vfIdx = result.command.indexOf("-vf");
    const filter = result.command[vfIdx + 1];
    expect(filter).toContain("eq=brightness=0.5:contrast=1.5:saturation=1.2");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
  });

  it("builds blur and grayscale filters", async () => {
    const p = makeParams({
      paramOverrides: {
        brightness: 0,
        contrast: 1,
        saturation: 1,
        blur: 5,
        grayscale: true,
        sepia: false,
        filtersOutputFormat: "mp4",
      },
    });
    const result = await handleVideoFilters(p);

    const vfIdx = result.command.indexOf("-vf");
    const filter = result.command[vfIdx + 1];
    expect(filter).toContain("gblur=sigma=5");
    expect(filter).toContain("format=gray");
  });

  it("builds sepia filter", async () => {
    const p = makeParams({
      paramOverrides: {
        brightness: 0,
        contrast: 1,
        saturation: 1,
        blur: 0,
        grayscale: false,
        sepia: true,
        filtersOutputFormat: "mp4",
      },
    });
    const result = await handleVideoFilters(p);

    const vfIdx = result.command.indexOf("-vf");
    const filter = result.command[vfIdx + 1];
    expect(filter).toContain("colorchannelmixer");
  });

  it("uses -c copy when no filters applied", async () => {
    const p = makeParams({
      paramOverrides: {
        brightness: 0,
        contrast: 1,
        saturation: 1,
        blur: 0,
        grayscale: false,
        sepia: false,
        filtersOutputFormat: "mp4",
      },
    });
    const result = await handleVideoFilters(p);

    expect(result.command).toContain("-c");
    expect(result.command).toContain("copy");
    expect(result.command).not.toContain("-preset");
  });

  it("does NOT add preset for webm output", async () => {
    const p = makeParams({
      paramOverrides: {
        brightness: 0.5,
        contrast: 1,
        saturation: 1,
        blur: 0,
        grayscale: false,
        sepia: false,
        filtersOutputFormat: "webm",
      },
    });
    const result = await handleVideoFilters(p);

    expect(result.outputExt).toBe(".webm");
    expect(result.command).not.toContain("-preset");
    expect(result.command).not.toContain("libx264");
  });
});

// ── Speed ─────────────────────────────────────────────────────────

describe("handleSpeed", () => {
  it("builds speed command with audio adjustment", async () => {
    const p = makeParams({
      paramOverrides: {
        speedValue: "2",
        adjustAudioPitch: true,
        speedOutputFormat: "mp4",
      },
    });
    const result = await handleSpeed(p);

    expect(result.outputExt).toBe(".mp4");
    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("setpts=0.5*PTS");
    expect(result.command).toContain("-af");
    expect(result.command).toContain("-preset");
  });

  it("removes audio when adjustAudioPitch is false", async () => {
    const p = makeParams({
      paramOverrides: {
        speedValue: "2",
        adjustAudioPitch: false,
        speedOutputFormat: "mp4",
      },
    });
    const result = await handleSpeed(p);

    expect(result.command).toContain("-an");
    expect(result.command).not.toContain("-af");
  });

  it("handles 0.25x speed correctly", async () => {
    const p = makeParams({
      paramOverrides: {
        speedValue: "0.25",
        adjustAudioPitch: true,
        speedOutputFormat: "mp4",
      },
    });
    const result = await handleSpeed(p);

    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("setpts=4*PTS");
  });
});

// ── Rotate ────────────────────────────────────────────────────────

describe("handleRotate", () => {
  it("builds 90° rotation command", async () => {
    const p = makeParams({
      paramOverrides: {
        rotation: "90",
        flipHorizontal: false,
        flipVertical: false,
        rotateOutputFormat: "mp4",
      },
    });
    const result = await handleRotate(p);

    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("transpose=1");
    expect(result.command).toContain("-preset");
  });

  it("builds 180° rotation (double transpose)", async () => {
    const p = makeParams({
      paramOverrides: {
        rotation: "180",
        flipHorizontal: false,
        flipVertical: false,
        rotateOutputFormat: "mp4",
      },
    });
    const result = await handleRotate(p);

    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("transpose=1,transpose=1");
  });

  it("combines rotation with flips", async () => {
    const p = makeParams({
      paramOverrides: {
        rotation: "90",
        flipHorizontal: true,
        flipVertical: true,
        rotateOutputFormat: "mp4",
      },
    });
    const result = await handleRotate(p);

    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toBe("transpose=1,hflip,vflip");
  });

  it("uses -c copy when no transforms", async () => {
    const p = makeParams({
      paramOverrides: {
        rotation: "0",
        flipHorizontal: false,
        flipVertical: false,
        rotateOutputFormat: "mp4",
      },
    });
    const result = await handleRotate(p);

    expect(result.command).toContain("-c");
    expect(result.command).toContain("copy");
    expect(result.command).not.toContain("-preset");
  });
});

// ── Merge ─────────────────────────────────────────────────────────

describe("handleMerge", () => {
  it("builds concat command without transition", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        videoBinaryProperties: "video1,video2",
        mergeOutputFormat: "mp4",
        addTransition: false,
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("video-data"));
    p.items = [{
      json: {},
      binary: {
        video1: { data: "", mimeType: "video/mp4", fileName: "v1.mp4" },
        video2: { data: "", mimeType: "video/mp4", fileName: "v2.mp4" },
      },
    }] as unknown as HandlerParams["items"];

    const result = await handleMerge(p);

    expect(result.command).toContain("-f");
    expect(result.command).toContain("concat");
    expect(result.command).toContain("-c");
    expect(result.command).toContain("copy");
    expect(result.command).not.toContain("-preset");
    // 2 input files + 1 list file = 3 temp files
    expect(result.tempFiles.length).toBe(3);
  });

  it("builds transition command with preset", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        videoBinaryProperties: "video1,video2",
        mergeOutputFormat: "mp4",
        addTransition: true,
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("video-data"));
    p.items = [{
      json: {},
      binary: {
        video1: { data: "", mimeType: "video/mp4", fileName: "v1.mp4" },
        video2: { data: "", mimeType: "video/mp4", fileName: "v2.mp4" },
      },
    }] as unknown as HandlerParams["items"];

    const result = await handleMerge(p);

    expect(result.command).toContain("-c:v");
    expect(result.command).toContain("libx264");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
    expect(result.command).toContain("-vf");
  });

  it("throws when fewer than 2 videos", async () => {
    const p = makeParams({
      paramOverrides: {
        videoBinaryProperties: "video1",
        mergeOutputFormat: "mp4",
        addTransition: false,
      },
    });

    await expect(handleMerge(p)).rejects.toThrow(
      "At least 2 video binary properties are required",
    );
  });

  it("loads files in parallel", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        videoBinaryProperties: "v1,v2,v3",
        mergeOutputFormat: "mp4",
        addTransition: false,
      },
    });
    const mockGetBuffer = jest.fn().mockResolvedValue(Buffer.from("data"));
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      mockGetBuffer;
    p.items = [{
      json: {},
      binary: {
        v1: { data: "", mimeType: "video/mp4", fileName: "v1.mp4" },
        v2: { data: "", mimeType: "video/mp4", fileName: "v2.mp4" },
        v3: { data: "", mimeType: "video/mp4", fileName: "v3.mp4" },
      },
    }] as unknown as HandlerParams["items"];

    await handleMerge(p);

    expect(mockGetBuffer).toHaveBeenCalledTimes(3);
  });
});

// ── Overlay ───────────────────────────────────────────────────────

describe("handleOverlay", () => {
  it("builds watermark overlay command", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        overlayBinaryProperty: "overlay",
        overlayType: "watermark",
        overlayX: "10",
        overlayY: "10",
        overlayWidth: -1,
        overlayHeight: -1,
        overlayOpacity: 1.0,
        overlayOutputFormat: "mp4",
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("overlay-img"));
    p.items = [{
      json: {},
      binary: {
        data: { data: "", mimeType: "video/mp4", fileName: "video.mp4" },
        overlay: { data: "", mimeType: "image/png", fileName: "logo.png" },
      },
    }] as unknown as HandlerParams["items"];

    const result = await handleOverlay(p);

    expect(result.command).toContain("-filter_complex");
    expect(result.command).toContain("-map");
    expect(result.command).toContain("[outv]");
    expect(result.command).toContain("-preset");
    expect(result.tempFiles.length).toBe(1); // overlay file
  });

  it("applies opacity for watermark", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        overlayBinaryProperty: "overlay",
        overlayType: "watermark",
        overlayX: "10",
        overlayY: "10",
        overlayWidth: -1,
        overlayHeight: -1,
        overlayOpacity: 0.5,
        overlayOutputFormat: "mp4",
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("overlay-img"));
    p.items = [{
      json: {},
      binary: {
        data: { data: "", mimeType: "video/mp4" },
        overlay: { data: "", mimeType: "image/png" },
      },
    }] as unknown as HandlerParams["items"];

    const result = await handleOverlay(p);

    const fcIdx = result.command.indexOf("-filter_complex");
    const filter = result.command[fcIdx + 1];
    expect(filter).toContain("colorchannelmixer=aa=0.5");
  });

  it("builds PiP command with audio mix", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        overlayBinaryProperty: "overlay",
        overlayType: "pip",
        overlayX: "100",
        overlayY: "100",
        overlayWidth: 320,
        overlayHeight: 240,
        overlayOpacity: 1.0,
        overlayOutputFormat: "mp4",
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("pip-video"));
    p.items = [{
      json: {},
      binary: {
        data: { data: "", mimeType: "video/mp4" },
        overlay: { data: "", mimeType: "video/mp4" },
      },
    }] as unknown as HandlerParams["items"];

    const result = await handleOverlay(p);

    const fcIdx = result.command.indexOf("-filter_complex");
    const filter = result.command[fcIdx + 1];
    expect(filter).toContain("amix=inputs=2");
    expect(result.command).toContain("[outa]");
  });
});

// ── Subtitle ──────────────────────────────────────────────────────

describe("handleSubtitle", () => {
  it("builds subtitle burn-in command with SRT", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        subtitleBinaryProperty: "subtitle",
        subtitleFormat: "srt",
        subtitleFontSize: 24,
        subtitleFontColor: "white",
        subtitleBgOpacity: 0.5,
        subtitlePosition: "bottom",
        subtitleOutputFormat: "mp4",
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("subtitle-data"));

    const result = await handleSubtitle(p);

    expect(result.command).toContain("-vf");
    const vfIdx = result.command.indexOf("-vf");
    const filter = result.command[vfIdx + 1];
    expect(filter).toContain("subtitles=");
    expect(filter).toContain("FontSize=24");
    expect(result.command).toContain("-preset");
    expect(result.tempFiles.length).toBe(1); // subtitle file
  });

  it("handles different positions", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        subtitleBinaryProperty: "subtitle",
        subtitleFormat: "srt",
        subtitleFontSize: 24,
        subtitleFontColor: "yellow",
        subtitleBgOpacity: 0,
        subtitlePosition: "top",
        subtitleOutputFormat: "mp4",
      },
    });
    (p.ctx as unknown as ReturnType<typeof createMockContext>).helpers.getBinaryDataBuffer =
      jest.fn().mockResolvedValue(Buffer.from("sub"));

    const result = await handleSubtitle(p);

    const vfIdx = result.command.indexOf("-vf");
    const filter = result.command[vfIdx + 1];
    expect(filter).toContain("Alignment=6");
  });
});

// ── GIF ───────────────────────────────────────────────────────────

describe("handleGif", () => {
  it("builds GIF command with palette generation", async () => {
    const p = makeParams({
      paramOverrides: {
        gifOutputFormat: "gif",
        gifWidth: 480,
        gifHeight: -1,
        gifFps: 10,
        gifStartTime: "00:00:00",
        gifDuration: "5",
        gifColors: 128,
        gifDither: "bayer",
        gifLoop: true,
      },
    });
    const result = await handleGif(p);

    expect(result.outputExt).toBe(".gif");
    expect(result.command).toContain("-filter_complex");
    const fcIdx = result.command.indexOf("-filter_complex");
    const filter = result.command[fcIdx + 1];
    expect(filter).toContain("palettegen");
    expect(filter).toContain("paletteuse");
    expect(filter).toContain("max_colors=128");
    expect(filter).toContain("dither=bayer");
    expect(result.command).toContain("-loop");
    expect(result.command).toContain("0");
  });

  it("builds WebP command", async () => {
    const p = makeParams({
      paramOverrides: {
        gifOutputFormat: "webp",
        gifWidth: 320,
        gifHeight: 240,
        gifFps: 15,
        gifStartTime: "00:00:01",
        gifDuration: "3",
        gifColors: 256,
        gifDither: "none",
        gifLoop: false,
      },
    });
    const result = await handleGif(p);

    expect(result.outputExt).toBe(".webp");
    expect(result.command).toContain("-vf");
    expect(result.command).not.toContain("-filter_complex");
    expect(result.command).toContain("-loop");
    expect(result.command).toContain("1"); // non-looping webp
  });
});

// ── Image Sequence ────────────────────────────────────────────────

describe("handleImageSequence", () => {
  it("builds image sequence command", async () => {
    const p = makeParams({
      paramOverrides: {
        sequenceOutputFormat: "jpg",
        sequenceWidth: -1,
        sequenceHeight: -1,
        sequenceFps: 1,
        sequenceStartTime: "00:00:00",
        sequenceDuration: "10",
        sequenceQuality: 90,
      },
    });
    const result = await handleImageSequence(p);

    expect(result.outputFormat).toBe("jpg");
    expect(result.command).toContain("-vf");
    expect(result.command).toContain("-q:v");
    expect(result.command[result.command.length - 1]).toContain("frame_%04d");
  });

  it("handles PNG format (no quality flag)", async () => {
    const p = makeParams({
      paramOverrides: {
        sequenceOutputFormat: "png",
        sequenceWidth: 640,
        sequenceHeight: 480,
        sequenceFps: 2,
        sequenceStartTime: "00:00:05",
        sequenceDuration: "",
        sequenceQuality: 90,
      },
    });
    const result = await handleImageSequence(p);

    expect(result.outputFormat).toBe("png");
    expect(result.command).not.toContain("-q:v");
  });
});

describe("readImageSequenceFrames", () => {
  it("reads frames until file not found", () => {
    const ffmpeg = createMockFFmpeg();
    // Write 3 frames
    ffmpeg.FS("writeFile", "frame_0001.jpg", new Uint8Array([1, 2, 3]));
    ffmpeg.FS("writeFile", "frame_0002.jpg", new Uint8Array([4, 5, 6]));
    ffmpeg.FS("writeFile", "frame_0003.jpg", new Uint8Array([7, 8, 9]));

    const results = readImageSequenceFrames(
      ffmpeg,
      "jpg",
      "data",
      { someKey: "value" },
      "input.mp4",
    );

    expect(results.length).toBe(3);
    expect(results[0].json.ffmpeg).toEqual({
      operation: "imageSequence",
      inputFilename: "input.mp4",
      outputFilename: "frame_0001.jpg",
      frameIndex: 1,
      size: 3,
    });
    expect(results[2].binary!.data.mimeType).toBe("image/jpeg");
  });

  it("returns empty array when no frames", () => {
    const ffmpeg = createMockFFmpeg();
    const results = readImageSequenceFrames(
      ffmpeg,
      "png",
      "data",
      {},
      "input.mp4",
    );
    expect(results).toEqual([]);
  });
});

// ── Social Media ──────────────────────────────────────────────────

describe("handleSocialMedia", () => {
  it("builds YouTube 1080p preset command", async () => {
    const p = makeParams({
      paramOverrides: { socialMediaPreset: "youtube_1080p" },
    });
    const result = await handleSocialMedia(p);

    expect(result.outputExt).toBe(".mp4");
    expect(result.command).toContain("-c:v");
    expect(result.command).toContain("libx264");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
    expect(result.command).toContain("-b:v");
    expect(result.command).toContain("8000k");
    expect(result.command).toContain("-movflags");
    expect(result.command).toContain("+faststart");

    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toContain("1920");
    expect(result.command[vfIdx + 1]).toContain("1080");
  });

  it("builds TikTok preset with max duration", async () => {
    const p = makeParams({
      paramOverrides: { socialMediaPreset: "tiktok" },
    });
    const result = await handleSocialMedia(p);

    expect(result.command).toContain("-t");
    expect(result.command).toContain("180");
    const vfIdx = result.command.indexOf("-vf");
    expect(result.command[vfIdx + 1]).toContain("1080");
    expect(result.command[vfIdx + 1]).toContain("1920");
  });

  it("throws for unknown preset", async () => {
    const p = makeParams({
      paramOverrides: { socialMediaPreset: "nonexistent" },
    });
    await expect(handleSocialMedia(p)).rejects.toThrow("Unknown social media preset");
  });
});

// ── Compress to Size ──────────────────────────────────────────────

describe("handleCompressToSize", () => {
  it("probes metadata and builds compress command", async () => {
    const ffmpeg = createMockFFmpeg();
    const logLines: string[] = [];
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        targetSizeMB: 10,
        compressAudioBitrate: "128k",
        compressOutputFormat: "mp4",
      },
      getLog: () => logLines.join("\n"),
      resetLog: () => { logLines.length = 0; },
    });

    // Simulate FFmpeg log output during probe
    (ffmpeg.run as jest.Mock).mockImplementation(async () => {
      logLines.push("Duration: 00:01:00.00, start: 0.000000, bitrate: 5000 kb/s");
    });

    const result = await handleCompressToSize(p);

    expect(result.outputExt).toBe(".mp4");
    expect(result.command).toContain("-c:v");
    expect(result.command).toContain("libx264");
    expect(result.command).toContain("-preset");
    expect(result.command).toContain("ultrafast");
    expect(result.command).toContain("-b:v");
    expect(result.command).toContain("-maxrate");
    expect(result.command).toContain("-bufsize");
    expect(result.command).toContain("-movflags");
    expect(result.command).toContain("+faststart");

    // Verify probe was called
    expect(ffmpeg.run).toHaveBeenCalledWith("-i", p.inputFilename, "-hide_banner");
  });

  it("uses fallback duration when metadata parsing fails", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({
      ffmpeg,
      paramOverrides: {
        targetSizeMB: 5,
        compressAudioBitrate: "128k",
        compressOutputFormat: "mp4",
      },
    });
    // No log output → falls back to 60s duration

    const result = await handleCompressToSize(p);

    expect(result.command).toContain("-b:v");
    // For 5MB target, 60s duration: (5*8*1024*1024)/60/1000 - 128 ≈ 571k
    const bvIdx = result.command.indexOf("-b:v");
    const bitrate = parseInt(result.command[bvIdx + 1]);
    expect(bitrate).toBeGreaterThan(0);
  });
});

// ── Metadata ──────────────────────────────────────────────────────

describe("handleMetadata", () => {
  it("runs probe and parses metadata", async () => {
    const ffmpeg = createMockFFmpeg();
    const logLines: string[] = [];
    const p = makeParams({
      ffmpeg,
      getLog: () => logLines.join("\n"),
      resetLog: () => { logLines.length = 0; },
    });

    (ffmpeg.run as jest.Mock).mockImplementation(async () => {
      logLines.push(
        "Input #0, mov,mp4, from 'input.mp4':",
        "  Duration: 00:02:30.50, bitrate: 2000 kb/s",
        "    Stream #0:0: Video: h264, yuv420p, 1280x720, 30 fps",
        "    Stream #0:1: Audio: aac, 44100 Hz, stereo",
      );
    });

    const result = await handleMetadata(p);

    expect(result.metadata.duration).toBe("00:02:30.50");
    expect(result.metadata.durationSeconds).toBeCloseTo(150.5, 1);
    expect(result.metadata.videoCodec).toBe("h264");
    expect(result.metadata.width).toBe(1280);
    expect(result.metadata.height).toBe(720);
    expect(result.metadata.audioCodec).toBe("aac");
  });

  it("handles empty log output gracefully", async () => {
    const ffmpeg = createMockFFmpeg();
    const p = makeParams({ ffmpeg });

    const result = await handleMetadata(p);

    expect(result.metadata.duration).toBeUndefined();
    expect(result.metadata.videoCodec).toBeUndefined();
  });
});

// ── Custom ────────────────────────────────────────────────────────

describe("handleCustom", () => {
  it("builds custom command with input/output substitution", async () => {
    const p = makeParams({
      paramOverrides: {
        ffmpegArgs: "-i input -vf scale=640:-1 -y output",
        outputExtension: "avi",
      },
    });
    const result = await handleCustom(p);

    expect(result.outputExt).toBe(".avi");
    expect(result.command).toContain(p.inputFilename);
    expect(result.command).toContain(`${p.outputFilename}.avi`);
    expect(result.command).toContain("-vf");
    expect(result.command).toContain("scale=640:-1");
  });

  it("rejects path traversal in arguments", async () => {
    const p = makeParams({
      paramOverrides: {
        ffmpegArgs: "-i ../../etc/passwd -y output",
        outputExtension: "mp4",
      },
    });

    await expect(handleCustom(p)).rejects.toThrow("path traversal");
  });

  it("allows normal arguments without path traversal", async () => {
    const p = makeParams({
      paramOverrides: {
        ffmpegArgs: "-i input -c:v libx264 -crf 23 -y output",
        outputExtension: "mp4",
      },
    });
    const result = await handleCustom(p);

    expect(result.command).toContain("-c:v");
    expect(result.command).toContain("libx264");
  });
});
