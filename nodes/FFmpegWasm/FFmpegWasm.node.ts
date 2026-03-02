import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import { FFmpeg } from "@ffmpeg/ffmpeg";

type OperationType =
  | "convert"
  | "extractAudio"
  | "resize"
  | "thumbnail"
  | "custom";

export class FFmpegWasm implements INodeType {
  description: INodeTypeDescription = {
    displayName: "FFmpeg.wasm",
    name: "ffmpegWasm",
    icon: "file:ffmpeg.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: "Process audio and video files using FFmpeg.wasm",
    defaults: {
      name: "FFmpeg.wasm",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "ffmpegWasmApi",
        required: false,
      },
    ],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Convert",
            value: "convert",
            description: "Convert media to a different format",
            action: "Convert media format",
          },
          {
            name: "Extract Audio",
            value: "extractAudio",
            description: "Extract audio track from video",
            action: "Extract audio from video",
          },
          {
            name: "Resize",
            value: "resize",
            description: "Resize video dimensions",
            action: "Resize video",
          },
          {
            name: "Thumbnail",
            value: "thumbnail",
            description: "Generate thumbnail from video",
            action: "Generate thumbnail",
          },
          {
            name: "Custom",
            value: "custom",
            description: "Run custom FFmpeg command",
            action: "Execute custom FFmpeg command",
          },
        ],
        default: "convert",
      },
      {
        displayName: "Binary Property",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        description: "Name of the binary property containing the input file",
        placeholder: "e.g. data",
      },
      {
        displayName: "Output Binary Property",
        name: "outputBinaryPropertyName",
        type: "string",
        default: "data",
        description: "Name of the binary property to store the output file",
        placeholder: "e.g. data",
      },
      // Convert operation options
      {
        displayName: "Output Format",
        name: "outputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["convert"],
          },
        },
        default: "",
        placeholder: "mp4, webm, mp3, wav...",
        description: "Output file format extension (e.g., mp4, webm, mp3)",
        required: true,
      },
      // Extract audio options
      {
        displayName: "Audio Format",
        name: "audioFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["extractAudio"],
          },
        },
        default: "mp3",
        description: "Audio format to extract (mp3, aac, wav, ogg)",
        required: true,
      },
      {
        displayName: "Audio Quality",
        name: "audioQuality",
        type: "options",
        options: [
          { name: "High (320kbps)", value: "320k" },
          { name: "Medium (192kbps)", value: "192k" },
          { name: "Low (128kbps)", value: "128k" },
          { name: "Very Low (96kbps)", value: "96k" },
        ],
        displayOptions: {
          show: {
            operation: ["extractAudio"],
          },
        },
        default: "192k",
        description: "Audio quality for extracted audio",
      },
      // Resize operation options
      {
        displayName: "Width",
        name: "width",
        type: "number",
        displayOptions: {
          show: {
            operation: ["resize"],
          },
        },
        default: 1280,
        description: "Output video width in pixels",
        required: true,
      },
      {
        displayName: "Height",
        name: "height",
        type: "number",
        displayOptions: {
          show: {
            operation: ["resize"],
          },
        },
        default: 720,
        description: "Output video height in pixels",
        required: true,
      },
      {
        displayName: "Keep Aspect Ratio",
        name: "keepAspectRatio",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["resize"],
          },
        },
        default: true,
        description:
          "Whether to maintain aspect ratio using -1 for auto-calculation",
      },
      // Thumbnail operation options
      {
        displayName: "Timestamp",
        name: "timestamp",
        type: "string",
        displayOptions: {
          show: {
            operation: ["thumbnail"],
          },
        },
        default: "00:00:01",
        placeholder: "00:00:05",
        description: "Timestamp to extract thumbnail (HH:MM:SS or seconds)",
        required: true,
      },
      {
        displayName: "Width",
        name: "thumbnailWidth",
        type: "number",
        displayOptions: {
          show: {
            operation: ["thumbnail"],
          },
        },
        default: 640,
        description: "Thumbnail width in pixels",
      },
      {
        displayName: "Height",
        name: "thumbnailHeight",
        type: "number",
        displayOptions: {
          show: {
            operation: ["thumbnail"],
          },
        },
        default: 360,
        description: "Thumbnail height in pixels (-1 for auto)",
      },
      // Custom command options
      {
        displayName: "FFmpeg Arguments",
        name: "ffmpegArgs",
        type: "string",
        typeOptions: {
          rows: 4,
        },
        displayOptions: {
          show: {
            operation: ["custom"],
          },
        },
        default: "",
        placeholder: "-i input.mp4 -vf scale=640:-1 output.mp4",
        description:
          'Custom FFmpeg arguments. Use "input" as input filename and "output" as output filename',
        required: true,
      },
      {
        displayName: "Output Extension",
        name: "outputExtension",
        type: "string",
        displayOptions: {
          show: {
            operation: ["custom"],
          },
        },
        default: "mp4",
        description: "Output file extension",
        required: true,
      },
      // Additional options
      {
        displayName: "Additional Options",
        name: "additionalOptions",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        options: [
          {
            displayName: "Timeout",
            name: "timeout",
            type: "number",
            default: 300,
            description: "Maximum execution time in seconds",
          },
          {
            displayName: "Enable Logging",
            name: "enableLogging",
            type: "boolean",
            default: false,
            description: "Whether to log FFmpeg output",
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Initialize FFmpeg
    const ffmpeg = new FFmpeg();

    try {
      // Load FFmpeg
      await ffmpeg.load();

      for (let i = 0; i < items.length; i++) {
        try {
          const binaryPropertyName = this.getNodeParameter(
            "binaryPropertyName",
            i,
          ) as string;
          const outputBinaryPropertyName = this.getNodeParameter(
            "outputBinaryPropertyName",
            i,
          ) as string;
          const operation = this.getNodeParameter(
            "operation",
            i,
          ) as OperationType;
          const additionalOptions = this.getNodeParameter(
            "additionalOptions",
            i,
            {},
          ) as {
            timeout?: number;
            enableLogging?: boolean;
          };

          // Get input binary data
          const binaryData = items[i].binary?.[binaryPropertyName];
          if (!binaryData) {
            throw new Error(
              `Binary data property "${binaryPropertyName}" not found`,
            );
          }

          // Create unique filenames
          const inputFilename = `input_${i}_${Date.now()}`;
          const outputFilename = `output_${i}_${Date.now()}`;

          // Write input file to FFmpeg virtual filesystem
          const inputData = await this.helpers.getBinaryDataBuffer(
            i,
            binaryPropertyName,
          );
          await ffmpeg.writeFile(inputFilename, inputData);

          // Prepare FFmpeg command based on operation
          let ffmpegCommand: string[] = [];
          let outputExt = "";

          switch (operation) {
            case "convert": {
              const outputFormat = this.getNodeParameter(
                "outputFormat",
                i,
              ) as string;
              outputExt = outputFormat.startsWith(".")
                ? outputFormat
                : `.${outputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;
              ffmpegCommand = ["-i", inputFilename, "-y", outputName];
              break;
            }
            case "extractAudio": {
              const audioFormat = this.getNodeParameter(
                "audioFormat",
                i,
              ) as string;
              const audioQuality = this.getNodeParameter(
                "audioQuality",
                i,
              ) as string;
              outputExt = `.${audioFormat}`;
              const outputName = `${outputFilename}${outputExt}`;
              ffmpegCommand = [
                "-i",
                inputFilename,
                "-vn",
                "-ar",
                "44100",
                "-ac",
                "2",
                "-b:a",
                audioQuality,
                "-y",
                outputName,
              ];
              break;
            }
            case "resize": {
              const width = this.getNodeParameter("width", i) as number;
              const height = this.getNodeParameter("height", i) as number;
              const keepAspectRatio = this.getNodeParameter(
                "keepAspectRatio",
                i,
              ) as boolean;
              outputExt = ".mp4";
              const outputName = `${outputFilename}${outputExt}`;
              const heightStr = keepAspectRatio ? "-1" : height.toString();
              ffmpegCommand = [
                "-i",
                inputFilename,
                "-vf",
                `scale=${width}:${heightStr}`,
                "-c:a",
                "copy",
                "-y",
                outputName,
              ];
              break;
            }
            case "thumbnail": {
              const timestamp = this.getNodeParameter("timestamp", i) as string;
              const thumbnailWidth = this.getNodeParameter(
                "thumbnailWidth",
                i,
              ) as number;
              const thumbnailHeight = this.getNodeParameter(
                "thumbnailHeight",
                i,
              ) as number;
              outputExt = ".jpg";
              const outputName = `${outputFilename}${outputExt}`;
              ffmpegCommand = [
                "-ss",
                timestamp,
                "-i",
                inputFilename,
                "-vframes",
                "1",
                "-q:v",
                "2",
                "-vf",
                `scale=${thumbnailWidth}:${thumbnailHeight}`,
                "-y",
                outputName,
              ];
              break;
            }
            case "custom": {
              const ffmpegArgs = this.getNodeParameter(
                "ffmpegArgs",
                i,
              ) as string;
              const outputExtension = this.getNodeParameter(
                "outputExtension",
                i,
              ) as string;
              outputExt = outputExtension.startsWith(".")
                ? outputExtension
                : `.${outputExtension}`;
              const outputName = `${outputFilename}${outputExt}`;

              // Replace placeholder names in custom arguments
              const argsString = ffmpegArgs
                .replace(/\binput\b/g, inputFilename)
                .replace(/\boutput\b/g, outputName);

              ffmpegCommand = argsString
                .split(/\s+/)
                .filter((arg) => arg.length > 0);
              break;
            }
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }

          // Execute FFmpeg command
          if (additionalOptions.enableLogging) {
            ffmpeg.on("log", ({ message }: { message: string }) => {
              console.log(`FFmpeg: ${message}`);
            });
          }

          await ffmpeg.exec(ffmpegCommand);

          // Read output file
          const outputName = `${outputFilename}${outputExt}`;
          const outputData = (await ffmpeg.readFile(outputName)) as Uint8Array;

          // Prepare output item
          const outputItem: INodeExecutionData = {
            json: {
              ...items[i].json,
              ffmpeg: {
                operation,
                inputFilename: binaryData.fileName || "input",
                outputFilename: outputName,
                size: outputData.length,
              },
            },
            binary: {
              [outputBinaryPropertyName]: {
                ...binaryData,
                data: Buffer.from(outputData).toString("base64"),
                fileName: outputName,
              },
            },
          };

          returnData.push(outputItem);

          // Cleanup virtual filesystem
          try {
            await ffmpeg.deleteFile(inputFilename);
            await ffmpeg.deleteFile(outputName);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({
              json: {
                ...items[i].json,
                error: error instanceof Error ? error.message : "Unknown error",
              },
            });
          } else {
            throw error;
          }
        }
      }
    } finally {
      // Cleanup FFmpeg instance
      try {
        await ffmpeg.deleteFile(".");
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    return [returnData];
  }
}
