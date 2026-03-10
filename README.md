# n8n-nodes-ffmpeg-wasm

<p align="center">
  <img src="nodes/FFmpegWasm/ffmpeg.svg" alt="FFmpeg n8n Node Logo" width="128">
</p>

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-ffmpeg-wasm.svg)](https://www.npmjs.com/package/n8n-nodes-ffmpeg-wasm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Process video and audio files in n8n workflows using FFmpeg.wasm** - No native binary required, pure JavaScript/WebAssembly implementation.

## Features

- **No FFmpeg binary installation required**
- **Pure JavaScript/WebAssembly** - Runs entirely in Node.js
- **21 operations** covering video, audio, and format processing
- **Works in Docker** - No volume mounts or binary installation needed
- **Memory efficient** - Virtual filesystem with automatic cleanup
- **Custom FFmpeg WASM URLs** via optional credentials

## Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-ffmpeg-wasm
```

Restart n8n and the node will be available in the node panel.

> **Note:** This node requires n8n version 1.0 or higher.

## Operations

### Video

| Operation | Description |
|-----------|-------------|
| **Convert** | Convert media between formats with optional codec/quality control |
| **Resize** | Scale video to custom dimensions with aspect ratio preservation |
| **Thumbnail** | Extract a frame at a specific timestamp as JPG |
| **Trim/Cut** | Extract a segment by start/end time or duration |
| **Merge Videos** | Concatenate multiple videos into one |
| **Video Filters** | Apply brightness, contrast, saturation, blur, grayscale, sepia |
| **Speed Adjustment** | Change playback speed (0.25x to 4x) with audio sync |
| **Rotate/Flip** | Rotate 90/180/270 degrees, flip horizontal/vertical |
| **Video Overlay** | Watermark or picture-in-picture with opacity and positioning |
| **Subtitle Burn-in** | Burn SRT/ASS/VTT subtitles into video |
| **GIF/WebP Animation** | Create animated GIF or WebP with palette optimization |
| **Image Sequence** | Export video frames as individual images |
| **Social Media Preset** | One-click optimization for YouTube, Instagram, TikTok, Twitter |

### Audio

| Operation | Description |
|-----------|-------------|
| **Extract Audio** | Extract audio track with quality selection |
| **Audio Mix** | Mix multiple audio tracks into one |
| **Audio Filters** | Volume, bass, treble, high/low pass filters |
| **Audio Normalize** | Normalize loudness to LUFS standard |

### Utility

| Operation | Description |
|-----------|-------------|
| **Media Info** | Extract metadata (duration, resolution, codec, bitrate) as JSON |
| **Remux (Fast Convert)** | Change container format without re-encoding (near-instant) |
| **Compress to Size** | Compress video to a target file size in MB |
| **Custom** | Run any FFmpeg command with full argument control |

## Usage Examples

### Convert with Codec Selection

1. Add the **FFmpeg.wasm** node
2. Select operation: **Convert**
3. Set output format (e.g., `webm`)
4. Optionally set Video Codec (H.264, H.265, VP9) and Quality (CRF)

### Social Media Optimization

1. Select operation: **Social Media Preset**
2. Pick a platform: YouTube 1080p, Instagram Reels, TikTok, Twitter, etc.
3. The video will be scaled, padded, and encoded to match platform requirements

### Extract Media Info

1. Select operation: **Media Info**
2. The node outputs JSON with duration, resolution, codec, bitrate, and format info
3. No binary output - useful for routing decisions in workflows

### Create GIF from Video

1. Select operation: **GIF/WebP Animation**
2. Set start time, duration, frame rate, and width
3. Choose palette size and dithering for quality control

### Compress to Target Size

1. Select operation: **Compress to Size**
2. Set target size in MB (e.g., `25` for email attachments)
3. Audio bitrate is configurable (default 128k)

## Configuration

### Optional Credentials (FFmpeg.wasm API)

Configure custom URLs for the FFmpeg WASM core, binary, and worker files. Useful for self-hosting the WASM assets or pinning to a specific version. Leave empty to use defaults.

### Input/Output Binary Properties

The node reads from and writes to n8n binary properties. Common input sources:
- **HTTP Request** node (downloaded file)
- **Read Binary Files** node (local file)
- **Google Drive** / **AWS S3** nodes

Output can be passed to **Write Binary File**, uploaded to cloud storage, or processed by another node.

## Docker Usage

This node works in Docker without modifications:

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    volumes:
      - ~/.n8n:/home/node/.n8n
```

No need to install FFmpeg in the container.

## Performance Considerations

### Memory Usage
- FFmpeg.wasm uses WebAssembly memory
- Large files (>500MB) may cause memory issues
- Process files in batches if possible

### Processing Speed
- Single-threaded (WebAssembly limitation)
- Slower than native FFmpeg
- Suitable for small to medium files
- Use **Remux** for near-instant container format changes

### Best Practices
1. Keep files under 500MB
2. Process at lower resolutions when possible
3. Use efficient formats (MP4/H.264, WebM/VP9)
4. Trim long videos before processing
5. Set appropriate timeouts via Additional Options

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm.git
cd n8n-nodes-ffmpeg-wasm
npm install
npm run build
npm run dev    # watch mode
npm test       # run tests
npm run lint   # lint code
npm run format # format code
```

### Project Structure

```
n8n-nodes-ffmpeg-wasm/
├── credentials/
│   └── FFmpegWasmApi.credentials.ts
├── nodes/
│   ├── FFmpegWasm/
│   │   ├── FFmpegWasm.node.ts
│   │   ├── helpers.ts
│   │   ├── ffmpeg.svg
│   │   └── __tests__/
│   │       └── helpers.test.ts
│   └── index.ts
├── dist/
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Troubleshooting

### Common Issues

**"FFmpeg is not loaded" error**
- The WASM loads automatically on first use. Wait for initialization.

**"Out of memory" error**
- File is too large. Increase Node.js memory: `node --max-old-space-size=4096`
- Process smaller files or lower resolution.

**"Unsupported format" error**
- Check input file format. Some formats may not be supported by FFmpeg.wasm.

**Slow performance**
- Expected with WASM. Use **Remux** for format changes without re-encoding.
- Consider native FFmpeg for batch processing of large files.

**Icon not displaying in n8n**
- This was fixed in v1.2.9. The FFmpeg icon now displays correctly in the n8n node panel.
- If you're on an older version, please update to the latest version.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Reporting Issues

Please include: n8n version, Node version, file format/size, error message, and steps to reproduce.

## License

MIT License - see [LICENSE](LICENSE) file

## Acknowledgments

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - WebAssembly port of FFmpeg
- [n8n](https://n8n.io/) - Workflow automation platform

## Support

- **Issues**: [GitHub Issues](https://github.com/Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm/discussions)

---

**Made for the n8n community**
