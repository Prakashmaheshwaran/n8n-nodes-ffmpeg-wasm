import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { MediaMetadata } from "./helpers";

export interface FFmpegInstance {
  load(): Promise<void>;
  run(...args: string[]): Promise<void>;
  FS(method: string, ...args: unknown[]): unknown;
  exit(): void;
  isLoaded(): boolean;
}

export interface HandlerParams {
  ctx: IExecuteFunctions;
  ffmpeg: FFmpegInstance;
  i: number;
  inputFilename: string;
  outputFilename: string;
  items: INodeExecutionData[];
  preset: string;
  getLog: () => string;
  resetLog: () => void;
}

export interface CommandResult {
  command: string[];
  outputExt: string;
  tempFiles: string[];
}

export interface MetadataOutput {
  metadata: MediaMetadata;
  tempFiles: string[];
}

export interface ImageSequenceOutput {
  command: string[];
  outputFormat: string;
  tempFiles: string[];
}

const X264_FORMATS = new Set([
  ".mp4", ".mkv", ".mov", ".m4v", ".ts", ".avi", ".flv", ".wmv", ".3gp",
]);

export function isX264Format(ext: string): boolean {
  return X264_FORMATS.has(ext.toLowerCase());
}
