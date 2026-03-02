import type {
  ICredentialType,
  ICredentialTestRequest,
  ICredentialTestResult,
} from "n8n-workflow";

export class FFmpegWasmApi implements ICredentialType {
  name = "ffmpegWasmApi";
  displayName = "FFmpeg.wasm API";
  documentationUrl = "https://ffmpegwasm.netlify.app/docs/overview";
  properties = [
    {
      displayName: "Core URL",
      name: "coreURL",
      type: "string",
      default: "",
      placeholder:
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
      description:
        "Custom URL for FFmpeg core (optional - leave empty to use default)",
    },
    {
      displayName: "Wasm URL",
      name: "wasmURL",
      type: "string",
      default: "",
      placeholder:
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
      description:
        "Custom URL for FFmpeg WASM binary (optional - leave empty to use default)",
    },
    {
      displayName: "Worker URL",
      name: "workerURL",
      type: "string",
      default: "",
      placeholder:
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js",
      description:
        "Custom URL for FFmpeg worker (optional - leave empty to use default)",
    },
  ];

  test = {
    request: {
      baseURL: "",
      url: "",
      method: "GET" as const,
    },
  };

  async test(
    this: ICredentialTestRequest,
    credentials: ICredentialTestRequest["credentials"],
  ): Promise<ICredentialTestResult> {
    try {
      // FFmpeg.wasm doesn't require traditional API credentials
      // This is a placeholder for credential validation
      return {
        status: "OK",
        message: "FFmpeg.wasm credentials are valid (no API key required)",
      };
    } catch (error) {
      return {
        status: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error during credential test",
      };
    }
  }
}
