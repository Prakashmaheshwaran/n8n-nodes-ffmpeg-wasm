import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import { createFFmpeg } from "@ffmpeg/ffmpeg";
import {
  getInputExtension,
  getMimeTypeFromExtension,
} from "./helpers";
import type { HandlerParams, CommandResult } from "./types";
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
} from "./operations";

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
  | "imageSequence"
  | "metadata"
  | "remux"
  | "socialMedia"
  | "compressToSize";

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
            description:
              "Apply video filters like brightness, contrast, blur",
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
          {
            name: "Media Info",
            value: "metadata",
            description:
              "Extract metadata (duration, resolution, codec, bitrate)",
            action: "Extract media metadata",
          },
          {
            name: "Remux (Fast Convert)",
            value: "remux",
            description:
              "Change container format without re-encoding (near-instant)",
            action: "Remux container format",
          },
          {
            name: "Social Media Preset",
            value: "socialMedia",
            description:
              "Optimize video for a social media platform",
            action: "Apply social media preset",
          },
          {
            name: "Compress to Size",
            value: "compressToSize",
            description:
              "Compress video to a target file size",
            action: "Compress to target size",
          },
        ],
        default: "convert",
      },
      {
        displayName: "Binary Property",
        name: "binaryPropertyName",
        type: "string",
        default: "data",
        description:
          "Name of the binary property containing the input file",
        placeholder: "e.g. data",
      },
      {
        displayName: "Output Binary Property",
        name: "outputBinaryPropertyName",
        type: "string",
        default: "data",
        displayOptions: {
          hide: {
            operation: ["metadata"],
          },
        },
        description:
          "Name of the binary property to store the output file",
        placeholder: "e.g. data",
      },
      // ── Convert ──
      {
        displayName: "Output Format",
        name: "outputFormat",
        type: "string",
        displayOptions: { show: { operation: ["convert"] } },
        default: "",
        placeholder: "mp4, webm, mp3, wav...",
        description:
          "Output file format extension (e.g., mp4, webm, mp3)",
        required: true,
      },
      {
        displayName: "Video Codec",
        name: "videoCodec",
        type: "options",
        displayOptions: { show: { operation: ["convert"] } },
        options: [
          { name: "Auto (default)", value: "auto" },
          { name: "H.264 (libx264)", value: "libx264" },
          { name: "H.265 (libx265)", value: "libx265" },
          { name: "VP9 (libvpx-vp9)", value: "libvpx-vp9" },
        ],
        default: "auto",
        description: "Video codec to use for encoding",
      },
      {
        displayName: "Audio Codec",
        name: "audioCodec",
        type: "options",
        displayOptions: { show: { operation: ["convert"] } },
        options: [
          { name: "Auto (default)", value: "auto" },
          { name: "AAC", value: "aac" },
          { name: "MP3 (libmp3lame)", value: "libmp3lame" },
          { name: "Opus (libopus)", value: "libopus" },
        ],
        default: "auto",
        description: "Audio codec to use for encoding",
      },
      {
        displayName: "Quality (CRF)",
        name: "crf",
        type: "number",
        displayOptions: { show: { operation: ["convert"] } },
        default: -1,
        description:
          "Constant Rate Factor (0-51, lower = better quality, -1 for auto). Typical: 18-28",
      },
      // ── Extract Audio ──
      {
        displayName: "Audio Format",
        name: "audioFormat",
        type: "string",
        displayOptions: { show: { operation: ["extractAudio"] } },
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
        displayOptions: { show: { operation: ["extractAudio"] } },
        default: "192k",
        description: "Audio quality for extracted audio",
      },
      // ── Resize ──
      {
        displayName: "Width",
        name: "width",
        type: "number",
        displayOptions: { show: { operation: ["resize"] } },
        default: 1280,
        description: "Output video width in pixels",
        required: true,
      },
      {
        displayName: "Height",
        name: "height",
        type: "number",
        displayOptions: { show: { operation: ["resize"] } },
        default: 720,
        description: "Output video height in pixels",
        required: true,
      },
      {
        displayName: "Keep Aspect Ratio",
        name: "keepAspectRatio",
        type: "boolean",
        displayOptions: { show: { operation: ["resize"] } },
        default: true,
        description:
          "Whether to maintain aspect ratio using -1 for auto-calculation",
      },
      // ── Thumbnail ──
      {
        displayName: "Timestamp",
        name: "timestamp",
        type: "string",
        displayOptions: { show: { operation: ["thumbnail"] } },
        default: "00:00:01",
        placeholder: "00:00:05",
        description:
          "Timestamp to extract thumbnail (HH:MM:SS or seconds)",
        required: true,
      },
      {
        displayName: "Width",
        name: "thumbnailWidth",
        type: "number",
        displayOptions: { show: { operation: ["thumbnail"] } },
        default: 640,
        description: "Thumbnail width in pixels",
      },
      {
        displayName: "Height",
        name: "thumbnailHeight",
        type: "number",
        displayOptions: { show: { operation: ["thumbnail"] } },
        default: 360,
        description: "Thumbnail height in pixels (-1 for auto)",
      },
      // ── Custom ──
      {
        displayName: "FFmpeg Arguments",
        name: "ffmpegArgs",
        type: "string",
        typeOptions: { rows: 4 },
        displayOptions: { show: { operation: ["custom"] } },
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
        displayOptions: { show: { operation: ["custom"] } },
        default: "mp4",
        description: "Output file extension",
        required: true,
      },
      // ── Merge ──
      {
        displayName: "Video Binary Properties",
        name: "videoBinaryProperties",
        type: "string",
        displayOptions: { show: { operation: ["merge"] } },
        default: "data",
        placeholder: "data,video1,video2",
        description:
          "Comma-separated list of binary property names to merge",
        required: true,
      },
      {
        displayName: "Output Format",
        name: "mergeOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["merge"] } },
        default: "mp4",
        description: "Output format for merged video",
        required: true,
      },
      {
        displayName: "Add Fade Effect",
        name: "addTransition",
        type: "boolean",
        displayOptions: { show: { operation: ["merge"] } },
        default: false,
        description:
          "Whether to apply a fade-in effect and pixel format normalization to the merged output",
      },
      // ── Trim ──
      {
        displayName: "Start Time",
        name: "startTime",
        type: "string",
        displayOptions: { show: { operation: ["trim"] } },
        default: "00:00:00",
        placeholder: "00:00:10 or 10",
        description:
          "Start time for trimming (HH:MM:SS or seconds)",
        required: true,
      },
      {
        displayName: "End Time",
        name: "endTime",
        type: "string",
        displayOptions: { show: { operation: ["trim"] } },
        default: "",
        placeholder: "00:01:00 or 60",
        description:
          "End time for trimming (HH:MM:SS or seconds). Leave empty to trim to end",
      },
      {
        displayName: "Duration",
        name: "duration",
        type: "string",
        displayOptions: { show: { operation: ["trim"] } },
        default: "",
        placeholder: "00:00:30 or 30",
        description:
          "Duration to trim (HH:MM:SS or seconds). Alternative to End Time",
      },
      // ── Video Filters ──
      {
        displayName: "Brightness",
        name: "brightness",
        type: "number",
        displayOptions: { show: { operation: ["videoFilters"] } },
        default: 0,
        description: "Adjust brightness (-1.0 to 1.0, 0 is default)",
      },
      {
        displayName: "Contrast",
        name: "contrast",
        type: "number",
        displayOptions: { show: { operation: ["videoFilters"] } },
        default: 1,
        description:
          "Adjust contrast (0.0 to 2.0, 1.0 is default)",
      },
      {
        displayName: "Saturation",
        name: "saturation",
        type: "number",
        displayOptions: { show: { operation: ["videoFilters"] } },
        default: 1,
        description:
          "Adjust saturation (0.0 to 3.0, 1.0 is default)",
      },
      {
        displayName: "Blur",
        name: "blur",
        type: "number",
        displayOptions: { show: { operation: ["videoFilters"] } },
        default: 0,
        description: "Apply Gaussian blur (0 to 10, 0 is no blur)",
      },
      {
        displayName: "Grayscale",
        name: "grayscale",
        type: "boolean",
        displayOptions: { show: { operation: ["videoFilters"] } },
        default: false,
        description: "Whether to convert video to grayscale",
      },
      {
        displayName: "Sepia",
        name: "sepia",
        type: "boolean",
        displayOptions: { show: { operation: ["videoFilters"] } },
        default: false,
        description: "Whether to apply sepia effect",
      },
      {
        displayName: "Output Format",
        name: "filtersOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["videoFilters"] } },
        default: "mp4",
        description: "Output file format",
      },
      // ── Speed ──
      {
        displayName: "Speed",
        name: "speedValue",
        type: "options",
        displayOptions: { show: { operation: ["speed"] } },
        options: [
          { name: "0.25x (Very Slow)", value: "0.25" },
          { name: "0.5x (Slow)", value: "0.5" },
          { name: "0.75x (Slightly Slow)", value: "0.75" },
          { name: "1.25x (Slightly Fast)", value: "1.25" },
          { name: "1.5x (Fast)", value: "1.5" },
          { name: "2x (Double Speed)", value: "2" },
          { name: "4x (Quadruple Speed)", value: "4" },
        ],
        default: "2",
        description: "Playback speed multiplier",
        required: true,
      },
      {
        displayName: "Adjust Audio Pitch",
        name: "adjustAudioPitch",
        type: "boolean",
        displayOptions: { show: { operation: ["speed"] } },
        default: true,
        description:
          "Whether to adjust audio speed to match video (recommended)",
      },
      {
        displayName: "Output Format",
        name: "speedOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["speed"] } },
        default: "mp4",
        description: "Output file format",
      },
      // ── Rotate/Flip ──
      {
        displayName: "Rotation",
        name: "rotation",
        type: "options",
        displayOptions: { show: { operation: ["rotate"] } },
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
        displayOptions: { show: { operation: ["rotate"] } },
        default: false,
        description: "Whether to flip video horizontally",
      },
      {
        displayName: "Flip Vertical",
        name: "flipVertical",
        type: "boolean",
        displayOptions: { show: { operation: ["rotate"] } },
        default: false,
        description: "Whether to flip video vertically",
      },
      {
        displayName: "Output Format",
        name: "rotateOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["rotate"] } },
        default: "mp4",
        description: "Output file format",
      },
      // ── Audio Mix ──
      {
        displayName: "Audio Binary Properties",
        name: "audioBinaryProperties",
        type: "string",
        displayOptions: { show: { operation: ["audioMix"] } },
        default: "audio1,audio2",
        placeholder: "audio1,audio2,audio3",
        description:
          "Comma-separated list of binary property names to mix",
        required: true,
      },
      {
        displayName: "Output Format",
        name: "audioMixOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["audioMix"] } },
        default: "mp3",
        description: "Output audio format",
      },
      // ── Audio Filters ──
      {
        displayName: "Volume",
        name: "volume",
        type: "number",
        displayOptions: { show: { operation: ["audioFilters"] } },
        default: 1.0,
        description:
          "Volume multiplier (0.5 = half volume, 2.0 = double)",
      },
      {
        displayName: "Bass Boost",
        name: "bassBoost",
        type: "number",
        displayOptions: { show: { operation: ["audioFilters"] } },
        default: 0,
        description: "Bass boost in dB (0-20)",
      },
      {
        displayName: "Treble Boost",
        name: "trebleBoost",
        type: "number",
        displayOptions: { show: { operation: ["audioFilters"] } },
        default: 0,
        description: "Treble boost in dB (0-20)",
      },
      {
        displayName: "High Pass Filter",
        name: "highPass",
        type: "number",
        displayOptions: { show: { operation: ["audioFilters"] } },
        default: 0,
        description:
          "High pass filter frequency in Hz (0 to disable)",
      },
      {
        displayName: "Low Pass Filter",
        name: "lowPass",
        type: "number",
        displayOptions: { show: { operation: ["audioFilters"] } },
        default: 0,
        description:
          "Low pass filter frequency in Hz (0 to disable)",
      },
      {
        displayName: "Output Format",
        name: "audioFiltersOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["audioFilters"] } },
        default: "mp3",
        description: "Output audio format",
      },
      // ── Audio Normalize ──
      {
        displayName: "Target Loudness",
        name: "targetLoudness",
        type: "number",
        displayOptions: { show: { operation: ["audioNormalize"] } },
        default: -14,
        description:
          "Target loudness in LUFS (-70 to -5, -14 is standard)",
      },
      {
        displayName: "True Peak Limit",
        name: "truePeak",
        type: "number",
        displayOptions: { show: { operation: ["audioNormalize"] } },
        default: -1,
        description:
          "True peak limit in dBTP (-9 to 0, -1 is standard)",
      },
      {
        displayName: "Output Format",
        name: "audioNormalizeOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["audioNormalize"] } },
        default: "mp3",
        description: "Output audio format",
      },
      // ── Overlay ──
      {
        displayName: "Overlay Binary Property",
        name: "overlayBinaryProperty",
        type: "string",
        displayOptions: { show: { operation: ["overlay"] } },
        default: "overlay",
        description:
          "Name of binary property containing overlay image/video",
        required: true,
      },
      {
        displayName: "Overlay Type",
        name: "overlayType",
        type: "options",
        displayOptions: { show: { operation: ["overlay"] } },
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
        displayOptions: { show: { operation: ["overlay"] } },
        default: "10",
        description:
          "X position (pixels or expressions like W-w-10)",
      },
      {
        displayName: "Position Y",
        name: "overlayY",
        type: "string",
        displayOptions: { show: { operation: ["overlay"] } },
        default: "10",
        description:
          "Y position (pixels or expressions like H-h-10)",
      },
      {
        displayName: "Overlay Width",
        name: "overlayWidth",
        type: "number",
        displayOptions: { show: { operation: ["overlay"] } },
        default: -1,
        description: "Overlay width (-1 for original size)",
      },
      {
        displayName: "Overlay Height",
        name: "overlayHeight",
        type: "number",
        displayOptions: { show: { operation: ["overlay"] } },
        default: -1,
        description: "Overlay height (-1 for original size)",
      },
      {
        displayName: "Opacity",
        name: "overlayOpacity",
        type: "number",
        displayOptions: { show: { operation: ["overlay"] } },
        default: 1.0,
        description: "Overlay opacity (0.0 to 1.0)",
      },
      {
        displayName: "Output Format",
        name: "overlayOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["overlay"] } },
        default: "mp4",
        description: "Output file format",
      },
      // ── Subtitle ──
      {
        displayName: "Subtitle Binary Property",
        name: "subtitleBinaryProperty",
        type: "string",
        displayOptions: { show: { operation: ["subtitle"] } },
        default: "subtitle",
        description:
          "Name of binary property containing subtitle file (SRT, ASS, VTT)",
        required: true,
      },
      {
        displayName: "Subtitle Format",
        name: "subtitleFormat",
        type: "options",
        displayOptions: { show: { operation: ["subtitle"] } },
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
        displayOptions: { show: { operation: ["subtitle"] } },
        default: 24,
        description: "Font size for subtitles",
      },
      {
        displayName: "Font Color",
        name: "subtitleFontColor",
        type: "string",
        displayOptions: { show: { operation: ["subtitle"] } },
        default: "white",
        description:
          "Font color name (white, yellow, red, etc.) or hex (#FFFFFF)",
      },
      {
        displayName: "Background Opacity",
        name: "subtitleBgOpacity",
        type: "number",
        displayOptions: { show: { operation: ["subtitle"] } },
        default: 0.5,
        description:
          "Background box opacity (0.0 to 1.0, 0 for transparent)",
      },
      {
        displayName: "Position",
        name: "subtitlePosition",
        type: "options",
        displayOptions: { show: { operation: ["subtitle"] } },
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
        displayOptions: { show: { operation: ["subtitle"] } },
        default: "mp4",
        description: "Output file format",
      },
      // ── GIF/WebP ──
      {
        displayName: "Output Format",
        name: "gifOutputFormat",
        type: "options",
        displayOptions: { show: { operation: ["gif"] } },
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
        displayOptions: { show: { operation: ["gif"] } },
        default: 480,
        description: "Output width in pixels (-1 for auto)",
      },
      {
        displayName: "Height",
        name: "gifHeight",
        type: "number",
        displayOptions: { show: { operation: ["gif"] } },
        default: -1,
        description: "Output height in pixels (-1 for auto)",
      },
      {
        displayName: "Frame Rate",
        name: "gifFps",
        type: "number",
        displayOptions: { show: { operation: ["gif"] } },
        default: 10,
        description: "Frames per second for animation",
      },
      {
        displayName: "Start Time",
        name: "gifStartTime",
        type: "string",
        displayOptions: { show: { operation: ["gif"] } },
        default: "00:00:00",
        description:
          "Start time for animation (HH:MM:SS or seconds)",
      },
      {
        displayName: "Duration",
        name: "gifDuration",
        type: "string",
        displayOptions: { show: { operation: ["gif"] } },
        default: "5",
        description: "Duration of animation in seconds",
      },
      {
        displayName: "Color Palette",
        name: "gifColors",
        type: "number",
        displayOptions: { show: { operation: ["gif"] } },
        default: 128,
        description:
          "Number of colors in palette (2-256, higher = better quality)",
      },
      {
        displayName: "Dither",
        name: "gifDither",
        type: "options",
        displayOptions: { show: { operation: ["gif"] } },
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
        displayOptions: { show: { operation: ["gif"] } },
        default: true,
        description: "Whether to loop animation infinitely",
      },
      // ── Image Sequence ──
      {
        displayName: "Output Format",
        name: "sequenceOutputFormat",
        type: "options",
        displayOptions: { show: { operation: ["imageSequence"] } },
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
        displayOptions: { show: { operation: ["imageSequence"] } },
        default: -1,
        description: "Output width in pixels (-1 for original)",
      },
      {
        displayName: "Height",
        name: "sequenceHeight",
        type: "number",
        displayOptions: { show: { operation: ["imageSequence"] } },
        default: -1,
        description: "Output height in pixels (-1 for original)",
      },
      {
        displayName: "Frame Rate",
        name: "sequenceFps",
        type: "number",
        displayOptions: { show: { operation: ["imageSequence"] } },
        default: 1,
        description:
          "Extract one frame every N seconds (fps=1 means 1 frame/sec)",
      },
      {
        displayName: "Start Time",
        name: "sequenceStartTime",
        type: "string",
        displayOptions: { show: { operation: ["imageSequence"] } },
        default: "00:00:00",
        description:
          "Start time for extraction (HH:MM:SS or seconds)",
      },
      {
        displayName: "Duration",
        name: "sequenceDuration",
        type: "string",
        displayOptions: { show: { operation: ["imageSequence"] } },
        default: "",
        description:
          "Duration to extract (seconds). Leave empty for entire video",
      },
      {
        displayName: "Quality (JPEG/WebP)",
        name: "sequenceQuality",
        type: "number",
        displayOptions: { show: { operation: ["imageSequence"] } },
        default: 90,
        description: "JPEG/WebP quality (1-100)",
      },
      // ── Remux ──
      {
        displayName: "Output Format",
        name: "remuxOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["remux"] } },
        default: "mp4",
        placeholder: "mp4, mkv, webm, mov...",
        description:
          "Target container format (no re-encoding, near-instant)",
        required: true,
      },
      // ── Social Media ──
      {
        displayName: "Platform Preset",
        name: "socialMediaPreset",
        type: "options",
        displayOptions: { show: { operation: ["socialMedia"] } },
        options: [
          { name: "YouTube 1080p", value: "youtube_1080p" },
          { name: "YouTube 720p", value: "youtube_720p" },
          { name: "YouTube Shorts", value: "youtube_shorts" },
          { name: "Instagram Feed", value: "instagram_feed" },
          { name: "Instagram Story", value: "instagram_story" },
          { name: "Instagram Reels", value: "instagram_reels" },
          { name: "TikTok", value: "tiktok" },
          { name: "Twitter / X", value: "twitter" },
        ],
        default: "youtube_1080p",
        description:
          "Pre-configured encoding settings for the target platform",
        required: true,
      },
      // ── Compress to Size ──
      {
        displayName: "Target Size (MB)",
        name: "targetSizeMB",
        type: "number",
        displayOptions: { show: { operation: ["compressToSize"] } },
        default: 10,
        description:
          "Target output file size in megabytes (approximate)",
        required: true,
      },
      {
        displayName: "Audio Bitrate",
        name: "compressAudioBitrate",
        type: "string",
        displayOptions: { show: { operation: ["compressToSize"] } },
        default: "128k",
        description: "Audio bitrate to use",
      },
      {
        displayName: "Output Format",
        name: "compressOutputFormat",
        type: "string",
        displayOptions: { show: { operation: ["compressToSize"] } },
        default: "mp4",
        description: "Output file format",
      },
      // ── Additional Options ──
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
            description: "Whether to log FFmpeg output to console",
          },
          {
            displayName: "Encoding Preset",
            name: "encodingPreset",
            type: "options",
            default: "ultrafast",
            description:
              "Encoding speed preset for x264/x265. Faster presets produce larger files but process much quicker in WebAssembly",
            options: [
              {
                name: "Ultra Fast (fastest, larger files)",
                value: "ultrafast",
              },
              { name: "Super Fast", value: "superfast" },
              { name: "Very Fast", value: "veryfast" },
              { name: "Faster", value: "faster" },
              { name: "Fast", value: "fast" },
              {
                name: "Medium (FFmpeg default, slowest)",
                value: "medium",
              },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    try {
      require.resolve("@ffmpeg/core");
    } catch {
      throw new Error(
        "FFmpeg.wasm core module (@ffmpeg/core) is not installed. " +
        "Please uninstall and reinstall the n8n-nodes-ffmpeg-wasm community node.",
      );
    }

    let corePath: string | undefined;
    try {
      const credentials =
        await this.getCredentials("ffmpegWasmApi");
      if (credentials.corePath) {
        corePath = credentials.corePath as string;
      }
    } catch {
      // Credentials not configured, use defaults
    }

    const firstOpts = this.getNodeParameter(
      "additionalOptions",
      0,
      {},
    ) as { enableLogging?: boolean };

    // Use array-based logging to avoid O(n^2) string concatenation
    const logLines: string[] = [];
    const getLog = () => logLines.join("\n");
    const resetLog = () => { logLines.length = 0; };

    const ffmpeg = createFFmpeg({
      log: firstOpts.enableLogging || false,
      logger: ({ message }: { message: string }) => {
        logLines.push(message);
      },
      ...(corePath ? { corePath } : {}),
    });

    try {
      // Node.js 18+ has global fetch() which breaks Emscripten's WASM loading:
      // it tries to fetch(filePath) instead of using fs.readFileSync().
      // Temporarily remove fetch to force the Node.js file-loading path.
      const globalAny = globalThis as Record<string, unknown>;
      const savedFetch = globalAny.fetch;
      try {
        delete globalAny.fetch;
        await ffmpeg.load();
      } catch (loadError) {
        const msg = loadError instanceof Error
          ? loadError.message
          : String(loadError);
        throw new Error(
          `Failed to initialize FFmpeg.wasm: ${msg}. ` +
          `Ensure the n8n instance has sufficient memory (512MB+ recommended).`,
        );
      } finally {
        globalAny.fetch = savedFetch;
      }

      for (let i = 0; i < items.length; i++) {
        try {
          const binaryPropertyName = this.getNodeParameter(
            "binaryPropertyName",
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
            encodingPreset?: string;
          };

          const binaryData = items[i].binary?.[binaryPropertyName];
          if (!binaryData) {
            throw new Error(
              `Binary data property "${binaryPropertyName}" not found`,
            );
          }

          const inputExt = getInputExtension(binaryData);
          const inputFilename = `input_${i}_${Date.now()}${inputExt}`;
          const outputFilename = `output_${i}_${Date.now()}`;

          const inputData = await this.helpers.getBinaryDataBuffer(
            i,
            binaryPropertyName,
          );
          ffmpeg.FS("writeFile", inputFilename, new Uint8Array(inputData));

          const preset = additionalOptions.encodingPreset || "ultrafast";

          const handlerParams: HandlerParams = {
            ctx: this,
            ffmpeg,
            i,
            inputFilename,
            outputFilename,
            items,
            preset,
            getLog,
            resetLog,
          };

          // ── Metadata (special: no output file) ──
          if (operation === "metadata") {
            const result = await handleMetadata(handlerParams);

            returnData.push({
              json: {
                ...items[i].json,
                ffmpeg: { operation, ...result.metadata },
              },
            });

            safeUnlink(ffmpeg, inputFilename);
            for (const f of result.tempFiles) safeUnlink(ffmpeg, f);
            continue;
          }

          const outputBinaryPropertyName = this.getNodeParameter(
            "outputBinaryPropertyName",
            i,
          ) as string;

          // ── Image Sequence (special: multiple output files) ──
          if (operation === "imageSequence") {
            const result = await handleImageSequence(handlerParams);

            const seqTimeoutMs =
              (additionalOptions.timeout || 300) * 1000;
            resetLog();

            let seqTimeoutId: ReturnType<typeof setTimeout>;
            await Promise.race([
              ffmpeg.run(...result.command),
              new Promise<never>((_, reject) => {
                seqTimeoutId = setTimeout(
                  () => reject(new Error(
                    `FFmpeg timed out after ${additionalOptions.timeout || 300}s`,
                  )),
                  seqTimeoutMs,
                );
              }),
            ]);
            clearTimeout(seqTimeoutId!);

            const frameResults = readImageSequenceFrames(
              ffmpeg,
              result.outputFormat,
              outputBinaryPropertyName,
              items[i].json,
              binaryData.fileName || "input",
            );
            returnData.push(...frameResults);

            safeUnlink(ffmpeg, inputFilename);
            for (const f of result.tempFiles) safeUnlink(ffmpeg, f);
            continue;
          }

          // ── Trim (inline: uses -c copy, no encoding) ──
          let commandResult: CommandResult;
          if (operation === "trim") {
            const startTime = this.getNodeParameter("startTime", i) as string;
            const endTime = this.getNodeParameter("endTime", i) as string;
            const duration = this.getNodeParameter("duration", i) as string;
            const outputExt = ".mp4";
            const outputName = `${outputFilename}${outputExt}`;
            const command = ["-i", inputFilename, "-ss", startTime];
            if (duration) {
              command.push("-t", duration);
            } else if (endTime) {
              command.push("-to", endTime);
            }
            command.push("-c", "copy", "-y", outputName);
            commandResult = { command, outputExt, tempFiles: [] };
          } else {
            // ── All other operations ──
            const handler = OPERATION_HANDLERS[operation];
            if (!handler) {
              throw new Error(`Unknown operation: ${operation}`);
            }
            commandResult = await handler(handlerParams);
          }

          // Add -movflags +faststart for MP4 outputs that don't already have it
          if (
            commandResult.outputExt === ".mp4" &&
            !commandResult.command.includes("-movflags")
          ) {
            const yIdx = commandResult.command.indexOf("-y");
            if (yIdx !== -1) {
              commandResult.command.splice(
                yIdx,
                0,
                "-movflags",
                "+faststart",
              );
            }
          }

          // Run FFmpeg with timeout (and clear timer on success)
          const timeoutMs =
            (additionalOptions.timeout || 300) * 1000;
          resetLog();

          let timeoutId: ReturnType<typeof setTimeout>;
          await Promise.race([
            ffmpeg.run(...commandResult.command),
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(
                () =>
                  reject(
                    new Error(
                      `FFmpeg timed out after ${additionalOptions.timeout || 300}s`,
                    ),
                  ),
                timeoutMs,
              );
            }),
          ]);
          clearTimeout(timeoutId!);

          const outputName = `${outputFilename}${commandResult.outputExt}`;
          const outputData = ffmpeg.FS("readFile", outputName) as Uint8Array;

          const outputMimeType = getMimeTypeFromExtension(
            commandResult.outputExt.replace(".", ""),
          );

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
                data: Buffer.from(outputData).toString("base64"),
                fileName: outputName,
                mimeType: outputMimeType,
              },
            },
          };

          returnData.push(outputItem);

          // Clean up all files written to WASM filesystem
          safeUnlink(ffmpeg, inputFilename);
          safeUnlink(ffmpeg, outputName);
          for (const f of commandResult.tempFiles) safeUnlink(ffmpeg, f);
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({
              json: {
                ...items[i].json,
                error:
                  error instanceof Error
                    ? error.message
                    : String(error),
              },
            });
          } else {
            if (error instanceof Error) throw error;
            throw new Error(String(error));
          }
        }
      }
    } finally {
      if (ffmpeg.isLoaded()) {
        try { ffmpeg.exit(); } catch {}
      }
    }

    return [returnData];
  }
}

function safeUnlink(
  ffmpeg: { FS(method: string, ...args: unknown[]): unknown },
  filename: string,
): void {
  try {
    ffmpeg.FS("unlink", filename);
  } catch {}
}

const OPERATION_HANDLERS: Record<
  string,
  (p: HandlerParams) => Promise<CommandResult>
> = {
  convert: handleConvert,
  extractAudio: handleExtractAudio,
  resize: handleResize,
  thumbnail: handleThumbnail,
  custom: handleCustom,
  merge: handleMerge,
  videoFilters: handleVideoFilters,
  speed: handleSpeed,
  rotate: handleRotate,
  audioMix: handleAudioMix,
  audioFilters: handleAudioFilters,
  audioNormalize: handleAudioNormalize,
  overlay: handleOverlay,
  subtitle: handleSubtitle,
  gif: handleGif,
  remux: handleRemux,
  socialMedia: handleSocialMedia,
  compressToSize: handleCompressToSize,
};
