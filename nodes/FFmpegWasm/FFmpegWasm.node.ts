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
  | "custom"
  | "merge"
  | "trim"
  | "videoFilters"
  | "speed"
  | "rotate"
  | "audioMix"
  | "audioFilters"
  | "audioNormalize"
  | "overlay"
  | "subtitle"
  | "gif"
  | "imageSequence";

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
          {
            name: "Merge Videos",
            value: "merge",
            description: "Merge multiple videos into one",
            action: "Merge videos",
          },
          {
            name: "Trim/Cut Video",
            value: "trim",
            description: "Trim or cut video to specific time range",
            action: "Trim video",
          },
          {
            name: "Video Filters",
            value: "videoFilters",
            description: "Apply video filters like brightness, contrast, blur",
            action: "Apply video filters",
          },
          {
            name: "Speed Adjustment",
            value: "speed",
            description: "Adjust video playback speed",
            action: "Adjust speed",
          },
          {
            name: "Rotate/Flip Video",
            value: "rotate",
            description: "Rotate or flip video orientation",
            action: "Rotate video",
          },
          {
            name: "Audio Mix",
            value: "audioMix",
            description: "Mix multiple audio tracks into one",
            action: "Mix audio tracks",
          },
          {
            name: "Audio Filters",
            value: "audioFilters",
            description: "Apply audio filters like volume, bass, treble",
            action: "Apply audio filters",
          },
          {
            name: "Audio Normalize",
            value: "audioNormalize",
            description: "Normalize audio levels to target loudness",
            action: "Normalize audio",
          },
          {
            name: "Video Overlay",
            value: "overlay",
            description:
              "Overlay video/image as watermark or picture-in-picture",
            action: "Overlay video or image",
          },
          {
            name: "Subtitle Burn-in",
            value: "subtitle",
            description: "Burn subtitles into video",
            action: "Burn subtitles into video",
          },
          {
            name: "GIF/WebP Animation",
            value: "gif",
            description: "Create animated GIF or WebP from video",
            action: "Create GIF or WebP animation",
          },
          {
            name: "Image Sequence Export",
            value: "imageSequence",
            description: "Export video frames as image sequence",
            action: "Export video to image sequence",
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
      // Merge videos options
      {
        displayName: "Video Binary Properties",
        name: "videoBinaryProperties",
        type: "string",
        displayOptions: {
          show: {
            operation: ["merge"],
          },
        },
        default: "data",
        placeholder: "data,video1,video2",
        description: "Comma-separated list of binary property names to merge",
        required: true,
      },
      {
        displayName: "Output Format",
        name: "mergeOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["merge"],
          },
        },
        default: "mp4",
        description: "Output format for merged video",
        required: true,
      },
      {
        displayName: "Add Transition",
        name: "addTransition",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["merge"],
          },
        },
        default: false,
        description: "Whether to add a fade transition between videos",
      },
      // Trim video options
      {
        displayName: "Start Time",
        name: "startTime",
        type: "string",
        displayOptions: {
          show: {
            operation: ["trim"],
          },
        },
        default: "00:00:00",
        placeholder: "00:00:10 or 10",
        description: "Start time for trimming (HH:MM:SS or seconds)",
        required: true,
      },
      {
        displayName: "End Time",
        name: "endTime",
        type: "string",
        displayOptions: {
          show: {
            operation: ["trim"],
          },
        },
        default: "",
        placeholder: "00:01:00 or 60",
        description:
          "End time for trimming (HH:MM:SS or seconds). Leave empty to trim to end",
      },
      {
        displayName: "Duration",
        name: "duration",
        type: "string",
        displayOptions: {
          show: {
            operation: ["trim"],
          },
        },
        default: "",
        placeholder: "00:00:30 or 30",
        description:
          "Duration to trim (HH:MM:SS or seconds). Alternative to End Time",
      },
      // Video filters options
      {
        displayName: "Brightness",
        name: "brightness",
        type: "number",
        displayOptions: {
          show: {
            operation: ["videoFilters"],
          },
        },
        default: 0,
        description: "Adjust brightness (-1.0 to 1.0, 0 is default)",
      },
      {
        displayName: "Contrast",
        name: "contrast",
        type: "number",
        displayOptions: {
          show: {
            operation: ["videoFilters"],
          },
        },
        default: 1,
        description: "Adjust contrast (0.0 to 2.0, 1.0 is default)",
      },
      {
        displayName: "Saturation",
        name: "saturation",
        type: "number",
        displayOptions: {
          show: {
            operation: ["videoFilters"],
          },
        },
        default: 1,
        description: "Adjust saturation (0.0 to 3.0, 1.0 is default)",
      },
      {
        displayName: "Blur",
        name: "blur",
        type: "number",
        displayOptions: {
          show: {
            operation: ["videoFilters"],
          },
        },
        default: 0,
        description: "Apply Gaussian blur (0 to 10, 0 is no blur)",
      },
      {
        displayName: "Grayscale",
        name: "grayscale",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["videoFilters"],
          },
        },
        default: false,
        description: "Whether to convert video to grayscale",
      },
      {
        displayName: "Sepia",
        name: "sepia",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["videoFilters"],
          },
        },
        default: false,
        description: "Whether to apply sepia effect",
      },
      {
        displayName: "Output Format",
        name: "filtersOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["videoFilters"],
          },
        },
        default: "mp4",
        description: "Output file format",
      },
      // Speed adjustment options
      {
        displayName: "Speed",
        name: "speedValue",
        type: "options",
        displayOptions: {
          show: {
            operation: ["speed"],
          },
        },
        options: [
          { name: "0.25x (Very Slow)", value: "0.25" },
          { name: "0.5x (Slow)", value: "0.5" },
          { name: "0.75x (Slightly Slow)", value: "0.75" },
          { name: "1x (Normal)", value: "1" },
          { name: "1.25x (Slightly Fast)", value: "1.25" },
          { name: "1.5x (Fast)", value: "1.5" },
          { name: "2x (Double Speed)", value: "2" },
          { name: "4x (Quadruple Speed)", value: "4" },
        ],
        default: "1",
        description: "Playback speed multiplier",
        required: true,
      },
      {
        displayName: "Adjust Audio Pitch",
        name: "adjustAudioPitch",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["speed"],
          },
        },
        default: true,
        description:
          "Whether to adjust audio pitch to match speed (recommended)",
      },
      {
        displayName: "Output Format",
        name: "speedOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["speed"],
          },
        },
        default: "mp4",
        description: "Output file format",
      },
      // Rotate/Flip options
      {
        displayName: "Rotation",
        name: "rotation",
        type: "options",
        displayOptions: {
          show: {
            operation: ["rotate"],
          },
        },
        options: [
          { name: "90 degrees clockwise", value: "90" },
          { name: "90 degrees counter-clockwise", value: "270" },
          { name: "180 degrees", value: "180" },
          { name: "No rotation", value: "0" },
        ],
        default: "90",
        description: "Rotate video by specified degrees",
      },
      {
        displayName: "Flip Horizontal",
        name: "flipHorizontal",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["rotate"],
          },
        },
        default: false,
        description: "Whether to flip video horizontally",
      },
      {
        displayName: "Flip Vertical",
        name: "flipVertical",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["rotate"],
          },
        },
        default: false,
        description: "Whether to flip video vertically",
      },
      {
        displayName: "Output Format",
        name: "rotateOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["rotate"],
          },
        },
        default: "mp4",
        description: "Output file format",
      },
      // Audio Mix options
      {
        displayName: "Audio Binary Properties",
        name: "audioBinaryProperties",
        type: "string",
        displayOptions: {
          show: {
            operation: ["audioMix"],
          },
        },
        default: "audio1,audio2",
        placeholder: "audio1,audio2,audio3",
        description: "Comma-separated list of binary property names to mix",
        required: true,
      },
      {
        displayName: "Output Format",
        name: "audioMixOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["audioMix"],
          },
        },
        default: "mp3",
        description: "Output audio format",
      },
      // Audio Filters options
      {
        displayName: "Volume",
        name: "volume",
        type: "number",
        displayOptions: {
          show: {
            operation: ["audioFilters"],
          },
        },
        default: 1.0,
        description: "Volume multiplier (0.5 = half volume, 2.0 = double)",
      },
      {
        displayName: "Bass Boost",
        name: "bassBoost",
        type: "number",
        displayOptions: {
          show: {
            operation: ["audioFilters"],
          },
        },
        default: 0,
        description: "Bass boost in dB (0-20)",
      },
      {
        displayName: "Treble Boost",
        name: "trebleBoost",
        type: "number",
        displayOptions: {
          show: {
            operation: ["audioFilters"],
          },
        },
        default: 0,
        description: "Treble boost in dB (0-20)",
      },
      {
        displayName: "High Pass Filter",
        name: "highPass",
        type: "number",
        displayOptions: {
          show: {
            operation: ["audioFilters"],
          },
        },
        default: 0,
        description: "High pass filter frequency in Hz (0 to disable)",
      },
      {
        displayName: "Low Pass Filter",
        name: "lowPass",
        type: "number",
        displayOptions: {
          show: {
            operation: ["audioFilters"],
          },
        },
        default: 0,
        description: "Low pass filter frequency in Hz (0 to disable)",
      },
      {
        displayName: "Output Format",
        name: "audioFiltersOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["audioFilters"],
          },
        },
        default: "mp3",
        description: "Output audio format",
      },
      // Audio Normalize options
      {
        displayName: "Target Loudness",
        name: "targetLoudness",
        type: "number",
        displayOptions: {
          show: {
            operation: ["audioNormalize"],
          },
        },
        default: -14,
        description: "Target loudness in LUFS (-70 to -5, -14 is standard)",
      },
      {
        displayName: "True Peak Limit",
        name: "truePeak",
        type: "number",
        displayOptions: {
          show: {
            operation: ["audioNormalize"],
          },
        },
        default: -1,
        description: "True peak limit in dBTP (-9 to 0, -1 is standard)",
      },
      {
        displayName: "Output Format",
        name: "audioNormalizeOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["audioNormalize"],
          },
        },
        default: "mp3",
        description: "Output audio format",
      },
      // Video Overlay options
      {
        displayName: "Overlay Binary Property",
        name: "overlayBinaryProperty",
        type: "string",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        default: "overlay",
        description: "Name of binary property containing overlay image/video",
        required: true,
      },
      {
        displayName: "Overlay Type",
        name: "overlayType",
        type: "options",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        options: [
          { name: "Watermark (Image)", value: "watermark" },
          { name: "Picture-in-Picture (Video)", value: "pip" },
        ],
        default: "watermark",
        description: "Type of overlay to apply",
        required: true,
      },
      {
        displayName: "Position X",
        name: "overlayX",
        type: "string",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        default: "10",
        description: "X position (pixels or expressions like W-w-10)",
      },
      {
        displayName: "Position Y",
        name: "overlayY",
        type: "string",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        default: "10",
        description: "Y position (pixels or expressions like H-h-10)",
      },
      {
        displayName: "Overlay Width",
        name: "overlayWidth",
        type: "number",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        default: -1,
        description: "Overlay width (-1 for original size)",
      },
      {
        displayName: "Overlay Height",
        name: "overlayHeight",
        type: "number",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        default: -1,
        description: "Overlay height (-1 for original size)",
      },
      {
        displayName: "Opacity",
        name: "overlayOpacity",
        type: "number",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        default: 1.0,
        description: "Overlay opacity (0.0 to 1.0)",
      },
      {
        displayName: "Output Format",
        name: "overlayOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["overlay"],
          },
        },
        default: "mp4",
        description: "Output file format",
      },
      // Subtitle Burn-in options
      {
        displayName: "Subtitle Binary Property",
        name: "subtitleBinaryProperty",
        type: "string",
        displayOptions: {
          show: {
            operation: ["subtitle"],
          },
        },
        default: "subtitle",
        description:
          "Name of binary property containing subtitle file (SRT, ASS, VTT)",
        required: true,
      },
      {
        displayName: "Subtitle Format",
        name: "subtitleFormat",
        type: "options",
        displayOptions: {
          show: {
            operation: ["subtitle"],
          },
        },
        options: [
          { name: "SRT", value: "srt" },
          { name: "ASS/SSA", value: "ass" },
          { name: "WebVTT", value: "vtt" },
        ],
        default: "srt",
        description: "Format of the subtitle file",
        required: true,
      },
      {
        displayName: "Font Size",
        name: "subtitleFontSize",
        type: "number",
        displayOptions: {
          show: {
            operation: ["subtitle"],
          },
        },
        default: 24,
        description: "Font size for subtitles",
      },
      {
        displayName: "Font Color",
        name: "subtitleFontColor",
        type: "string",
        displayOptions: {
          show: {
            operation: ["subtitle"],
          },
        },
        default: "white",
        description: "Font color (white, yellow, red, etc. or hex #FFFFFF)",
      },
      {
        displayName: "Background Opacity",
        name: "subtitleBgOpacity",
        type: "number",
        displayOptions: {
          show: {
            operation: ["subtitle"],
          },
        },
        default: 0.5,
        description: "Background box opacity (0.0 to 1.0, 0 for transparent)",
      },
      {
        displayName: "Position",
        name: "subtitlePosition",
        type: "options",
        displayOptions: {
          show: {
            operation: ["subtitle"],
          },
        },
        options: [
          { name: "Bottom", value: "bottom" },
          { name: "Top", value: "top" },
          { name: "Center", value: "center" },
        ],
        default: "bottom",
        description: "Vertical position of subtitles",
      },
      {
        displayName: "Output Format",
        name: "subtitleOutputFormat",
        type: "string",
        displayOptions: {
          show: {
            operation: ["subtitle"],
          },
        },
        default: "mp4",
        description: "Output file format",
      },
      // GIF/WebP Animation options
      {
        displayName: "Output Format",
        name: "gifOutputFormat",
        type: "options",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        options: [
          { name: "GIF", value: "gif" },
          { name: "WebP", value: "webp" },
        ],
        default: "gif",
        description: "Output animation format",
        required: true,
      },
      {
        displayName: "Width",
        name: "gifWidth",
        type: "number",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        default: 480,
        description: "Output width in pixels (-1 for auto)",
      },
      {
        displayName: "Height",
        name: "gifHeight",
        type: "number",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        default: -1,
        description: "Output height in pixels (-1 for auto)",
      },
      {
        displayName: "Frame Rate",
        name: "gifFps",
        type: "number",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        default: 10,
        description: "Frames per second for animation",
      },
      {
        displayName: "Start Time",
        name: "gifStartTime",
        type: "string",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        default: "00:00:00",
        description: "Start time for animation (HH:MM:SS or seconds)",
      },
      {
        displayName: "Duration",
        name: "gifDuration",
        type: "string",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        default: "5",
        description: "Duration of animation in seconds",
      },
      {
        displayName: "Color Palette",
        name: "gifColors",
        type: "number",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        default: 128,
        description:
          "Number of colors in palette (2-256, higher = better quality)",
      },
      {
        displayName: "Dither",
        name: "gifDither",
        type: "options",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        options: [
          { name: "None", value: "none" },
          { name: "Bayer", value: "bayer" },
          { name: "Floyd-Steinberg", value: "floyd_steinberg" },
        ],
        default: "bayer",
        description: "Dithering algorithm for color reduction",
      },
      {
        displayName: "Loop",
        name: "gifLoop",
        type: "boolean",
        displayOptions: {
          show: {
            operation: ["gif"],
          },
        },
        default: true,
        description: "Whether to loop animation infinitely",
      },
      // Image Sequence Export options
      {
        displayName: "Output Format",
        name: "sequenceOutputFormat",
        type: "options",
        displayOptions: {
          show: {
            operation: ["imageSequence"],
          },
        },
        options: [
          { name: "PNG", value: "png" },
          { name: "JPEG", value: "jpg" },
          { name: "WebP", value: "webp" },
        ],
        default: "jpg",
        description: "Output image format",
        required: true,
      },
      {
        displayName: "Width",
        name: "sequenceWidth",
        type: "number",
        displayOptions: {
          show: {
            operation: ["imageSequence"],
          },
        },
        default: -1,
        description: "Output width in pixels (-1 for original)",
      },
      {
        displayName: "Height",
        name: "sequenceHeight",
        type: "number",
        displayOptions: {
          show: {
            operation: ["imageSequence"],
          },
        },
        default: -1,
        description: "Output height in pixels (-1 for original)",
      },
      {
        displayName: "Frame Rate",
        name: "sequenceFps",
        type: "number",
        displayOptions: {
          show: {
            operation: ["imageSequence"],
          },
        },
        default: 1,
        description:
          "Extract one frame every N seconds (fps=1 means 1 frame/sec)",
      },
      {
        displayName: "Start Time",
        name: "sequenceStartTime",
        type: "string",
        displayOptions: {
          show: {
            operation: ["imageSequence"],
          },
        },
        default: "00:00:00",
        description: "Start time for extraction (HH:MM:SS or seconds)",
      },
      {
        displayName: "Duration",
        name: "sequenceDuration",
        type: "string",
        displayOptions: {
          show: {
            operation: ["imageSequence"],
          },
        },
        default: "",
        description:
          "Duration to extract (seconds). Leave empty for entire video",
      },
      {
        displayName: "Quality (JPEG/WebP)",
        name: "sequenceQuality",
        type: "number",
        displayOptions: {
          show: {
            operation: ["imageSequence"],
          },
        },
        default: 90,
        description: "JPEG/WebP quality (1-100)",
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
            i
          ) as string;
          const outputBinaryPropertyName = this.getNodeParameter(
            "outputBinaryPropertyName",
            i
          ) as string;
          const operation = this.getNodeParameter(
            "operation",
            i
          ) as OperationType;
          const additionalOptions = this.getNodeParameter(
            "additionalOptions",
            i,
            {}
          ) as {
            timeout?: number;
            enableLogging?: boolean;
          };

          // Get input binary data
          const binaryData = items[i].binary?.[binaryPropertyName];
          if (!binaryData) {
            throw new Error(
              `Binary data property "${binaryPropertyName}" not found`
            );
          }

          // Create unique filenames
          const inputFilename = `input_${i}_${Date.now()}`;
          const outputFilename = `output_${i}_${Date.now()}`;

          // Write input file to FFmpeg virtual filesystem
          const inputData = await this.helpers.getBinaryDataBuffer(
            i,
            binaryPropertyName
          );
          await ffmpeg.writeFile(inputFilename, inputData);

          // Prepare FFmpeg command based on operation
          let ffmpegCommand: string[] = [];
          let outputExt = "";

          switch (operation) {
            case "convert": {
              const outputFormat = this.getNodeParameter(
                "outputFormat",
                i
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
                i
              ) as string;
              const audioQuality = this.getNodeParameter(
                "audioQuality",
                i
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
                i
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
                i
              ) as number;
              const thumbnailHeight = this.getNodeParameter(
                "thumbnailHeight",
                i
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
                i
              ) as string;
              const outputExtension = this.getNodeParameter(
                "outputExtension",
                i
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
            case "merge": {
              const videoBinaryProperties = this.getNodeParameter(
                "videoBinaryProperties",
                i
              ) as string;
              const mergeOutputFormat = this.getNodeParameter(
                "mergeOutputFormat",
                i
              ) as string;
              const addTransition = this.getNodeParameter(
                "addTransition",
                i
              ) as boolean;

              const binaryProps = videoBinaryProperties
                .split(",")
                .map((p) => p.trim())
                .filter((p) => p.length > 0);

              if (binaryProps.length < 2) {
                throw new Error(
                  "At least 2 video binary properties are required for merging"
                );
              }

              // Write all input files
              const inputFiles: string[] = [];
              for (let j = 0; j < binaryProps.length; j++) {
                const propName = binaryProps[j];
                const videoData = await this.helpers.getBinaryDataBuffer(
                  i,
                  propName
                );
                const inputName = `input_${i}_${j}_${Date.now()}.mp4`;
                await ffmpeg.writeFile(inputName, videoData);
                inputFiles.push(inputName);
              }

              // Create concat list file
              const concatList = inputFiles
                .map((f) => `file '${f}'`)
                .join("\n");
              const listFilename = `list_${i}_${Date.now()}.txt`;
              await ffmpeg.writeFile(
                listFilename,
                new TextEncoder().encode(concatList)
              );

              outputExt = mergeOutputFormat.startsWith(".")
                ? mergeOutputFormat
                : `.${mergeOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;

              // Build concat command
              if (addTransition) {
                // With fade transition (more complex)
                ffmpegCommand = [
                  "-f",
                  "concat",
                  "-safe",
                  "0",
                  "-i",
                  listFilename,
                  "-vf",
                  "fade=st=0:d=0.5:alpha=1,format=yuv420p",
                  "-c:v",
                  "libx264",
                  "-preset",
                  "fast",
                  "-y",
                  outputName,
                ];
              } else {
                // Simple concat (same codec, fast)
                ffmpegCommand = [
                  "-f",
                  "concat",
                  "-safe",
                  "0",
                  "-i",
                  listFilename,
                  "-c",
                  "copy",
                  "-y",
                  outputName,
                ];
              }
              break;
            }
            case "trim": {
              const startTime = this.getNodeParameter("startTime", i) as string;
              const endTime = this.getNodeParameter("endTime", i) as string;
              const duration = this.getNodeParameter("duration", i) as string;
              outputExt = ".mp4";
              const outputName = `${outputFilename}${outputExt}`;
              ffmpegCommand = ["-i", inputFilename, "-ss", startTime];
              if (duration) {
                ffmpegCommand.push("-t", duration);
              } else if (endTime) {
                ffmpegCommand.push("-to", endTime);
              }
              ffmpegCommand.push("-c", "copy", "-y", outputName);
              break;
            }
            case "videoFilters": {
              const brightness = this.getNodeParameter(
                "brightness",
                i
              ) as number;
              const contrast = this.getNodeParameter("contrast", i) as number;
              const saturation = this.getNodeParameter(
                "saturation",
                i
              ) as number;
              const blur = this.getNodeParameter("blur", i) as number;
              const grayscale = this.getNodeParameter(
                "grayscale",
                i
              ) as boolean;
              const sepia = this.getNodeParameter("sepia", i) as boolean;
              const filtersOutputFormat = this.getNodeParameter(
                "filtersOutputFormat",
                i
              ) as string;
              const vfFilters: string[] = [];
              if (brightness !== 0) {
                vfFilters.push(`eq=brightness=${brightness}`);
              }
              if (contrast !== 1) {
                vfFilters.push(`eq=contrast=${contrast}`);
              }
              if (saturation !== 1) {
                vfFilters.push(`eq=saturation=${saturation}`);
              }
              if (blur > 0) {
                vfFilters.push(`gblur=sigma=${blur}`);
              }
              if (grayscale) {
                vfFilters.push("format=gray");
              }
              if (sepia) {
                vfFilters.push(
                  "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"
                );
              }
              outputExt = filtersOutputFormat.startsWith(".")
                ? filtersOutputFormat
                : `.${filtersOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;
              if (vfFilters.length > 0) {
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-vf",
                  vfFilters.join(","),
                  "-c:a",
                  "copy",
                  "-y",
                  outputName,
                ];
              } else {
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-c",
                  "copy",
                  "-y",
                  outputName,
                ];
              }
              break;
            }
            case "speed": {
              const speedValue = this.getNodeParameter(
                "speedValue",
                i
              ) as string;
              const adjustAudioPitch = this.getNodeParameter(
                "adjustAudioPitch",
                i
              ) as boolean;
              const speedOutputFormat = this.getNodeParameter(
                "speedOutputFormat",
                i
              ) as string;
              const speed = parseFloat(speedValue);
              outputExt = speedOutputFormat.startsWith(".")
                ? speedOutputFormat
                : `.${speedOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;
              const videoFilter = `setpts=${1 / speed}*PTS`;
              if (adjustAudioPitch) {
                const audioFilter = `atempo=${
                  speed > 2 ? 2 : speed < 0.5 ? 0.5 : speed
                }`;
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-vf",
                  videoFilter,
                  "-af",
                  audioFilter,
                  "-y",
                  outputName,
                ];
              } else {
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-vf",
                  videoFilter,
                  "-an",
                  "-y",
                  outputName,
                ];
              }
              break;
            }
            case "rotate": {
              const rotation = this.getNodeParameter("rotation", i) as string;
              const flipHorizontal = this.getNodeParameter(
                "flipHorizontal",
                i
              ) as boolean;
              const flipVertical = this.getNodeParameter(
                "flipVertical",
                i
              ) as boolean;
              const rotateOutputFormat = this.getNodeParameter(
                "rotateOutputFormat",
                i
              ) as string;
              const transposeValues: string[] = [];
              switch (rotation) {
                case "90":
                  transposeValues.push("1");
                  break;
                case "270":
                  transposeValues.push("2");
                  break;
                case "180":
                  transposeValues.push("1,1");
                  break;
                case "0":
                default:
                  break;
              }
              if (flipHorizontal) {
                transposeValues.push("3");
              }
              if (flipVertical) {
                transposeValues.push("0");
              }
              outputExt = rotateOutputFormat.startsWith(".")
                ? rotateOutputFormat
                : `.${rotateOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;
              if (transposeValues.length > 0) {
                const transposeFilter = transposeValues
                  .map((v) => `transpose=${v}`)
                  .join(",");
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-vf",
                  transposeFilter,
                  "-c:a",
                  "copy",
                  "-y",
                  outputName,
                ];
              } else {
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-c",
                  "copy",
                  "-y",
                  outputName,
                ];
              }
              break;
            }
            case "audioMix": {
              const audioBinaryProperties = this.getNodeParameter(
                "audioBinaryProperties",
                i
              ) as string;
              const audioMixOutputFormat = this.getNodeParameter(
                "audioMixOutputFormat",
                i
              ) as string;

              const binaryProps = audioBinaryProperties
                .split(",")
                .map((p) => p.trim())
                .filter((p) => p.length > 0);

              if (binaryProps.length < 2) {
                throw new Error(
                  "At least 2 audio binary properties are required for mixing"
                );
              }

              // Write all input files
              const inputFiles: string[] = [];
              for (let j = 0; j < binaryProps.length; j++) {
                const propName = binaryProps[j];
                const audioData = await this.helpers.getBinaryDataBuffer(
                  i,
                  propName
                );
                const inputName = `audio_input_${i}_${j}_${Date.now()}.wav`;
                await ffmpeg.writeFile(inputName, audioData);
                inputFiles.push(inputName);
              }

              outputExt = audioMixOutputFormat.startsWith(".")
                ? audioMixOutputFormat
                : `.${audioMixOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;

              // Build amix filter with all inputs
              const filterComplex =
                inputFiles.map((_f, idx) => `[${idx}:a]`).join("") +
                `amix=inputs=${inputFiles.length}:duration=longest[aout]`;

              const inputs: string[] = [];
              for (const _f of inputFiles) {
                inputs.push("-i", _f);
              }

              ffmpegCommand = [
                ...inputs,
                "-filter_complex",
                filterComplex,
                "-map",
                "[aout]",
                "-y",
                outputName,
              ];
              break;
            }
            case "audioFilters": {
              const volume = this.getNodeParameter("volume", i) as number;
              const bassBoost = this.getNodeParameter("bassBoost", i) as number;
              const trebleBoost = this.getNodeParameter(
                "trebleBoost",
                i
              ) as number;
              const highPass = this.getNodeParameter("highPass", i) as number;
              const lowPass = this.getNodeParameter("lowPass", i) as number;
              const audioFiltersOutputFormat = this.getNodeParameter(
                "audioFiltersOutputFormat",
                i
              ) as string;

              const afFilters: string[] = [];

              if (volume !== 1.0) {
                afFilters.push(`volume=${volume}`);
              }
              if (bassBoost > 0) {
                afFilters.push(`bass=g=${bassBoost}`);
              }
              if (trebleBoost > 0) {
                afFilters.push(`treble=g=${trebleBoost}`);
              }
              if (highPass > 0) {
                afFilters.push(`highpass=f=${highPass}`);
              }
              if (lowPass > 0) {
                afFilters.push(`lowpass=f=${lowPass}`);
              }

              outputExt = audioFiltersOutputFormat.startsWith(".")
                ? audioFiltersOutputFormat
                : `.${audioFiltersOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;

              if (afFilters.length > 0) {
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-af",
                  afFilters.join(","),
                  "-y",
                  outputName,
                ];
              } else {
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-c:a",
                  "copy",
                  "-y",
                  outputName,
                ];
              }
              break;
            }
            case "audioNormalize": {
              const targetLoudness = this.getNodeParameter(
                "targetLoudness",
                i
              ) as number;
              const truePeak = this.getNodeParameter("truePeak", i) as number;
              const audioNormalizeOutputFormat = this.getNodeParameter(
                "audioNormalizeOutputFormat",
                i
              ) as string;

              outputExt = audioNormalizeOutputFormat.startsWith(".")
                ? audioNormalizeOutputFormat
                : `.${audioNormalizeOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;

              // Use loudnorm filter for audio normalization
              const loudnormFilter = `loudnorm=I=${targetLoudness}:TP=${truePeak}:LRA=11`;

              ffmpegCommand = [
                "-i",
                inputFilename,
                "-af",
                loudnormFilter,
                "-y",
                outputName,
              ];
              break;
            }
            case "overlay": {
              const overlayBinaryProperty = this.getNodeParameter(
                "overlayBinaryProperty",
                i
              ) as string;
              const overlayType = this.getNodeParameter(
                "overlayType",
                i
              ) as string;
              const overlayX = this.getNodeParameter("overlayX", i) as string;
              const overlayY = this.getNodeParameter("overlayY", i) as string;
              const overlayWidth = this.getNodeParameter(
                "overlayWidth",
                i
              ) as number;
              const overlayHeight = this.getNodeParameter(
                "overlayHeight",
                i
              ) as number;
              const overlayOpacity = this.getNodeParameter(
                "overlayOpacity",
                i
              ) as number;
              const overlayOutputFormat = this.getNodeParameter(
                "overlayOutputFormat",
                i
              ) as string;

              // Get overlay binary data
              const overlayData = await this.helpers.getBinaryDataBuffer(
                i,
                overlayBinaryProperty
              );
              const overlayFilename = `overlay_${i}_${Date.now()}`;
              await ffmpeg.writeFile(overlayFilename, overlayData);

              outputExt = overlayOutputFormat.startsWith(".")
                ? overlayOutputFormat
                : `.${overlayOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;

              // Build overlay filter
              let overlayFilter = "";
              if (overlayWidth > 0 || overlayHeight > 0) {
                const widthStr =
                  overlayWidth > 0 ? overlayWidth.toString() : "-1";
                const heightStr =
                  overlayHeight > 0 ? overlayHeight.toString() : "-1";
                overlayFilter = `[1:v]scale=${widthStr}:${heightStr}`;
                if (overlayOpacity < 1.0) {
                  overlayFilter += `,format=rgba,colorchannelmixer=aa=${overlayOpacity}`;
                }
                overlayFilter += `[ovrl];[0:v][ovrl]overlay=${overlayX}:${overlayY}`;
              } else {
                if (overlayOpacity < 1.0) {
                  overlayFilter = `[1:v]format=rgba,colorchannelmixer=aa=${overlayOpacity}[ovrl];[0:v][ovrl]overlay=${overlayX}:${overlayY}`;
                } else {
                  overlayFilter = `overlay=${overlayX}:${overlayY}`;
                }
              }

              if (overlayType === "pip") {
                // For PiP, we want to keep both audio tracks
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-i",
                  overlayFilename,
                  "-filter_complex",
                  overlayFilter,
                  "-c:a",
                  "copy",
                  "-y",
                  outputName,
                ];
              } else {
                // For watermark, just use main audio
                ffmpegCommand = [
                  "-i",
                  inputFilename,
                  "-i",
                  overlayFilename,
                  "-filter_complex",
                  overlayFilter,
                  "-c:a",
                  "copy",
                  "-y",
                  outputName,
                ];
              }
              break;
            }
            case "subtitle": {
              const subtitleBinaryProperty = this.getNodeParameter(
                "subtitleBinaryProperty",
                i
              ) as string;
              const subtitleFormat = this.getNodeParameter(
                "subtitleFormat",
                i
              ) as string;
              const subtitleFontSize = this.getNodeParameter(
                "subtitleFontSize",
                i
              ) as number;
              const subtitleFontColor = this.getNodeParameter(
                "subtitleFontColor",
                i
              ) as string;
              const subtitleBgOpacity = this.getNodeParameter(
                "subtitleBgOpacity",
                i
              ) as number;
              const subtitlePosition = this.getNodeParameter(
                "subtitlePosition",
                i
              ) as string;
              const subtitleOutputFormat = this.getNodeParameter(
                "subtitleOutputFormat",
                i
              ) as string;

              // Get subtitle binary data
              const subtitleData = await this.helpers.getBinaryDataBuffer(
                i,
                subtitleBinaryProperty
              );
              const subtitleFilename = `subtitle_${i}_${Date.now()}.${subtitleFormat}`;
              await ffmpeg.writeFile(subtitleFilename, subtitleData);

              outputExt = subtitleOutputFormat.startsWith(".")
                ? subtitleOutputFormat
                : `.${subtitleOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;

              // Convert color to FFmpeg format
              let fontColor = subtitleFontColor;
              if (fontColor.startsWith("#")) {
                fontColor = fontColor.substring(1);
              }

              // Determine alignment based on position (2=bottom, 6=top, 5=center)
              let alignment = "2";
              if (subtitlePosition === "top") {
                alignment = "6";
              } else if (subtitlePosition === "center") {
                alignment = "5";
              }

              let subtitleFilter = "";

              // Add box if opacity > 0
              if (subtitleBgOpacity > 0) {
                const alphaHex = Math.round(subtitleBgOpacity * 255)
                  .toString(16)
                  .padStart(2, "0");
                subtitleFilter = `subtitles=${subtitleFilename}:force_style='FontSize=${subtitleFontSize},PrimaryColour=&H${fontColor},Alignment=${alignment},OutlineColour=&H000000,Outline=1,BorderStyle=4,BackColour=&H${alphaHex}000000'`;
              } else {
                subtitleFilter = `subtitles=${subtitleFilename}:force_style='FontSize=${subtitleFontSize},PrimaryColour=&H${fontColor},Alignment=${alignment}'`;
              }

              ffmpegCommand = [
                "-i",
                inputFilename,
                "-vf",
                subtitleFilter,
                "-c:a",
                "copy",
                "-y",
                outputName,
              ];
              break;
            }
            case "gif": {
              const gifOutputFormat = this.getNodeParameter(
                "gifOutputFormat",
                i
              ) as string;
              const gifWidth = this.getNodeParameter("gifWidth", i) as number;
              const gifHeight = this.getNodeParameter("gifHeight", i) as number;
              const gifFps = this.getNodeParameter("gifFps", i) as number;
              const gifStartTime = this.getNodeParameter(
                "gifStartTime",
                i
              ) as string;
              const gifDuration = this.getNodeParameter(
                "gifDuration",
                i
              ) as string;
              const gifColors = this.getNodeParameter("gifColors", i) as number;
              const gifDither = this.getNodeParameter("gifDither", i) as string;
              const gifLoop = this.getNodeParameter("gifLoop", i) as boolean;

              outputExt = `.${gifOutputFormat}`;
              const outputName = `${outputFilename}${outputExt}`;

              // Build scale filter
              const widthStr = gifWidth > 0 ? gifWidth.toString() : "-1";
              const heightStr = gifHeight > 0 ? gifHeight.toString() : "-1";
              const scaleFilter = `fps=${gifFps},scale=${widthStr}:${heightStr}:flags=lanczos`;

              if (gifOutputFormat === "gif") {
                // GIF with optimized palette
                const loopValue = gifLoop ? "0" : "-1";
                let gifFilter = `${scaleFilter},split[s0][s1];[s0]palettegen=${gifColors}[p];[s1][p]paletteuse=dither=${gifDither}`;

                ffmpegCommand = [
                  "-ss",
                  gifStartTime,
                  "-t",
                  gifDuration,
                  "-i",
                  inputFilename,
                  "-vf",
                  gifFilter,
                  "-loop",
                  loopValue,
                  "-y",
                  outputName,
                ];
              } else {
                // WebP animation
                const loopValue = gifLoop ? "0" : "1";
                ffmpegCommand = [
                  "-ss",
                  gifStartTime,
                  "-t",
                  gifDuration,
                  "-i",
                  inputFilename,
                  "-vf",
                  scaleFilter,
                  "-loop",
                  loopValue,
                  "-y",
                  outputName,
                ];
              }
              break;
            }
            case "imageSequence": {
              const sequenceOutputFormat = this.getNodeParameter(
                "sequenceOutputFormat",
                i
              ) as string;
              const sequenceWidth = this.getNodeParameter(
                "sequenceWidth",
                i
              ) as number;
              const sequenceHeight = this.getNodeParameter(
                "sequenceHeight",
                i
              ) as number;
              const sequenceFps = this.getNodeParameter(
                "sequenceFps",
                i
              ) as number;
              const sequenceStartTime = this.getNodeParameter(
                "sequenceStartTime",
                i
              ) as string;
              const sequenceDuration = this.getNodeParameter(
                "sequenceDuration",
                i
              ) as string;
              const sequenceQuality = this.getNodeParameter(
                "sequenceQuality",
                i
              ) as number;

              const outputPattern = `frame_%04d.${sequenceOutputFormat}`;

              // Build scale filter
              const widthStr =
                sequenceWidth > 0 ? sequenceWidth.toString() : "-1";
              const heightStr =
                sequenceHeight > 0 ? sequenceHeight.toString() : "-1";
              let vfFilter = `fps=1/${sequenceFps},scale=${widthStr}:${heightStr}`;

              // Prepare command
              const cmdArgs: string[] = ["-ss", sequenceStartTime];

              if (sequenceDuration && sequenceDuration.length > 0) {
                cmdArgs.push("-t", sequenceDuration);
              }

              cmdArgs.push("-i", inputFilename, "-vf", vfFilter);

              // Add quality settings for lossy formats
              if (
                sequenceOutputFormat === "jpg" ||
                sequenceOutputFormat === "jpeg"
              ) {
                cmdArgs.push(
                  "-q:v",
                  Math.round(((100 - sequenceQuality) / 100) * 31).toString()
                );
              } else if (sequenceOutputFormat === "webp") {
                cmdArgs.push("-q:v", sequenceQuality.toString());
              }

              cmdArgs.push("-y", outputPattern);
              ffmpegCommand = cmdArgs;

              // Note: For image sequence, output will be multiple files
              // We'll need to handle this differently
              outputExt = `.${sequenceOutputFormat}`;
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
