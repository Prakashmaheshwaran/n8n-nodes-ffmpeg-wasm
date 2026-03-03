import {
  colorToAssFormat,
  buildAtempoFilter,
  getMimeTypeFromExtension,
  getInputExtension,
  normalizeExtension,
  parseMetadataFromLogs,
} from "../helpers";

describe("colorToAssFormat", () => {
  it("converts named colors to ASS BGR format", () => {
    expect(colorToAssFormat("white")).toBe("&H00FFFFFF&");
    expect(colorToAssFormat("black")).toBe("&H00000000&");
    expect(colorToAssFormat("red")).toBe("&H000000FF&");
    expect(colorToAssFormat("blue")).toBe("&H00FF0000&");
    expect(colorToAssFormat("green")).toBe("&H0000FF00&");
    expect(colorToAssFormat("yellow")).toBe("&H0000FFFF&");
  });

  it("converts hex RGB to ASS BGR format", () => {
    expect(colorToAssFormat("#FF0000")).toBe("&H000000FF&");
    expect(colorToAssFormat("#00FF00")).toBe("&H0000FF00&");
    expect(colorToAssFormat("#0000FF")).toBe("&H00FF0000&");
    expect(colorToAssFormat("#FFFFFF")).toBe("&H00FFFFFF&");
  });

  it("handles lowercase hex input", () => {
    expect(colorToAssFormat("#ff8800")).toBe("&H000088FF&");
  });

  it("falls back to white for invalid input", () => {
    expect(colorToAssFormat("notacolor")).toBe("&H00FFFFFF&");
    expect(colorToAssFormat("")).toBe("&H00FFFFFF&");
    expect(colorToAssFormat("#GGG")).toBe("&H00FFFFFF&");
  });
});

describe("buildAtempoFilter", () => {
  it("returns identity for speed 1", () => {
    expect(buildAtempoFilter(1)).toBe("atempo=1");
  });

  it("handles speeds within 0.5-2.0 range directly", () => {
    expect(buildAtempoFilter(0.5)).toBe("atempo=0.5");
    expect(buildAtempoFilter(0.75)).toBe("atempo=0.75");
    expect(buildAtempoFilter(1.5)).toBe("atempo=1.5");
    expect(buildAtempoFilter(2)).toBe("atempo=2");
  });

  it("chains atempo filters for 4x speed", () => {
    expect(buildAtempoFilter(4)).toBe("atempo=2,atempo=2");
  });

  it("chains atempo filters for 0.25x speed", () => {
    expect(buildAtempoFilter(0.25)).toBe("atempo=0.5,atempo=0.5");
  });
});

describe("getMimeTypeFromExtension", () => {
  it("returns correct MIME types for common extensions", () => {
    expect(getMimeTypeFromExtension("mp4")).toBe("video/mp4");
    expect(getMimeTypeFromExtension(".mp3")).toBe("audio/mpeg");
    expect(getMimeTypeFromExtension("jpg")).toBe("image/jpeg");
    expect(getMimeTypeFromExtension(".png")).toBe("image/png");
    expect(getMimeTypeFromExtension("webm")).toBe("video/webm");
  });

  it("returns octet-stream for unknown extensions", () => {
    expect(getMimeTypeFromExtension("xyz")).toBe(
      "application/octet-stream",
    );
  });

  it("is case insensitive", () => {
    expect(getMimeTypeFromExtension("MP4")).toBe("video/mp4");
    expect(getMimeTypeFromExtension(".WAV")).toBe("audio/wav");
  });
});

describe("getInputExtension", () => {
  it("extracts extension from fileExtension field", () => {
    expect(getInputExtension({ fileExtension: "mp4" })).toBe(".mp4");
    expect(getInputExtension({ fileExtension: ".webm" })).toBe(
      ".webm",
    );
  });

  it("extracts extension from fileName", () => {
    expect(getInputExtension({ fileName: "video.mp4" })).toBe(".mp4");
    expect(
      getInputExtension({ fileName: "my.video.file.webm" }),
    ).toBe(".webm");
  });

  it("derives extension from mimeType", () => {
    expect(getInputExtension({ mimeType: "video/mp4" })).toBe(".mp4");
    expect(getInputExtension({ mimeType: "audio/mpeg" })).toBe(
      ".mp3",
    );
  });

  it("returns empty string when no info available", () => {
    expect(getInputExtension({})).toBe("");
  });

  it("prioritizes fileExtension over fileName over mimeType", () => {
    expect(
      getInputExtension({
        fileExtension: "webm",
        fileName: "video.mp4",
        mimeType: "video/quicktime",
      }),
    ).toBe(".webm");
  });
});

describe("normalizeExtension", () => {
  it("adds dot if missing", () => {
    expect(normalizeExtension("mp4")).toBe(".mp4");
  });

  it("keeps dot if present", () => {
    expect(normalizeExtension(".mp4")).toBe(".mp4");
  });

  it("returns empty for empty input", () => {
    expect(normalizeExtension("")).toBe("");
  });
});

describe("parseMetadataFromLogs", () => {
  const sampleLog = `
Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'input.mp4':
  Metadata:
    major_brand     : isom
    minor_version   : 512
  Duration: 00:05:23.40, start: 0.000000, bitrate: 1234 kb/s
    Stream #0:0(und): Video: h264 (High) (avc1 / 0x31637661), yuv420p, 1920x1080, 1000 kb/s, 30 fps, 30 tbr
    Stream #0:1(und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 128 kb/s
`;

  it("parses duration", () => {
    const meta = parseMetadataFromLogs(sampleLog);
    expect(meta.duration).toBe("00:05:23.40");
    expect(meta.durationSeconds).toBeCloseTo(323.4, 1);
  });

  it("parses bitrate", () => {
    const meta = parseMetadataFromLogs(sampleLog);
    expect(meta.bitrate).toBe("1234 kb/s");
  });

  it("parses video stream info", () => {
    const meta = parseMetadataFromLogs(sampleLog);
    expect(meta.videoCodec).toBe("h264");
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
    expect(meta.fps).toBe(30);
  });

  it("parses audio stream info", () => {
    const meta = parseMetadataFromLogs(sampleLog);
    expect(meta.audioCodec).toBe("aac");
    expect(meta.sampleRate).toBe(44100);
    expect(meta.channels).toBe("stereo");
  });

  it("parses format", () => {
    const meta = parseMetadataFromLogs(sampleLog);
    expect(meta.format).toBe("mov,mp4,m4a,3gp,3g2,mj2");
  });

  it("handles missing data gracefully", () => {
    const meta = parseMetadataFromLogs("no useful info here");
    expect(meta.duration).toBeUndefined();
    expect(meta.videoCodec).toBeUndefined();
    expect(meta.audioCodec).toBeUndefined();
  });
});
