import type { ICredentialType, INodeProperties } from "n8n-workflow";

export class FFmpegWasmApi implements ICredentialType {
  name = "ffmpegWasmApi";
  displayName = "FFmpeg.wasm Configuration";
  documentationUrl = "https://github.com/ffmpegwasm/ffmpeg.wasm";
  properties: INodeProperties[] = [
    {
      displayName: "Core Path",
      name: "corePath",
      type: "string",
      default: "",
      placeholder:
        "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
      description:
        "Custom URL or local path to ffmpeg-core.js (optional - leave empty to use CDN default)",
    },
  ];
}
