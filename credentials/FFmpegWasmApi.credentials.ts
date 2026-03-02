import type {
  ICredentialType,
  NodePropertyTypes,
} from "n8n-workflow";

export class FFmpegWasmApi implements ICredentialType {
  name = "ffmpegWasmApi";
  displayName = "FFmpeg.wasm API";
  documentationUrl = "https://ffmpegwasm.netlify.app/docs/overview";
  properties = [
    {
      displayName: "Core URL",
      name: "coreURL",
      type: "string" as NodePropertyTypes,
      default: "",
      placeholder:
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
      description:
        "Custom URL for FFmpeg core (optional - leave empty to use default)",
    },
    {
      displayName: "Wasm URL",
      name: "wasmURL",
      type: "string" as NodePropertyTypes,
      default: "",
      placeholder:
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
      description:
        "Custom URL for FFmpeg WASM binary (optional - leave empty to use default)",
    },
    {
      displayName: "Worker URL",
      name: "workerURL",
      type: "string" as NodePropertyTypes,
      default: "",
      placeholder:
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js",
      description:
        "Custom URL for FFmpeg worker (optional - leave empty to use default)",
    },
  ];
}
