# n8n-nodes-ffmpeg-wasm

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-ffmpeg-wasm.svg)](https://www.npmjs.com/package/n8n-nodes-ffmpeg-wasm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Process video and audio files in n8n workflows using FFmpeg.wasm** - No native binary required, pure JavaScript/WebAssembly implementation.

## 🚀 Features

- ✅ **No FFmpeg binary installation required**
- ✅ **Pure JavaScript/WebAssembly** - Runs entirely in Node.js
- ✅ **Convert** video/audio formats (MP4, WebM, MOV, MP3, AAC, etc.)
- ✅ **Extract audio** from video files
- ✅ **Resize/Scale** videos to custom dimensions
- ✅ **Generate thumbnails** from videos
- ✅ **Custom FFmpeg commands** for advanced use cases
- ✅ **Works in Docker** - No volume mounts or binary installation needed
- ✅ **Memory efficient** - Virtual filesystem with automatic cleanup

## 📦 Installation

### Method 1: Install from NPM (Recommended)

```bash
cd ~/.n8n/custom
npm install n8n-nodes-ffmpeg-wasm
```

Restart n8n and the node will be available in the node panel.

### Method 2: Install from GitHub

```bash
cd ~/.n8n/custom
npm install github:Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm
```

### Method 3: Local Development

```bash
# Clone the repository
git clone https://github.com/Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm.git
cd n8n-nodes-ffmpeg-wasm

# Install dependencies
npm install

# Build the node
npm run build

# Link to n8n
npm link

# In your n8n installation directory
npm link n8n-nodes-ffmpeg-wasm
```

## 🎬 Usage

### Basic Video Conversion

1. Add a node that provides a binary file (e.g., HTTP Request, Read Binary File)
2. Add the **FFmpeg.wasm** node
3. Select operation: **Convert**
4. Set output format: `mp4`, `webm`, `mov`, etc.
5. Run the workflow

### Extract Audio from Video

1. Add the **FFmpeg.wasm** node
2. Select operation: **Extract Audio**
3. Choose audio format: `mp3`, `aac`, `wav`, `ogg`
4. The audio file will be output as binary data

### Resize Video

1. Select operation: **Resize**
2. Set width and height (e.g., 1280x720)
3. Optional: maintain aspect ratio

### Generate Thumbnail

1. Select operation: **Thumbnail**
2. Set timestamp (e.g., `00:00:01` for 1 second)
3. Set output image format: `jpg` or `png`

### Custom FFmpeg Command

1. Select operation: **Custom**
2. Enter FFmpeg arguments as space-separated string:
   ```
   -i input.mp4 -vf scale=480:360 -c:a copy output.mp4
   ```

## 📋 Node Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Operation | options | Select operation: Convert, Extract Audio, Resize, Thumbnail, Custom |
| Binary Property | string | Name of the input binary property |
| Output Binary Property | string | Name of the output binary property |

### Operation-Specific Parameters

**Convert:**
- Output Format: Target format (mp4, webm, mov, avi, etc.)

**Extract Audio:**
- Audio Format: mp3, aac, wav, ogg
- Sample Rate: 44100, 48000
- Channels: Mono, Stereo

**Resize:**
- Width: Target width in pixels
- Height: Target height in pixels
- Maintain Aspect Ratio: Yes/No

**Thumbnail:**
- Timestamp: Time position (HH:MM:SS or seconds)
- Format: jpg, png

**Custom:**
- FFmpeg Arguments: Space-separated command arguments

## ⚙️ Configuration

### Input Binary Property

The node expects binary data from a previous node. Common sources:
- **HTTP Request** node (downloaded file)
- **Read Binary Files** node (local file)
- **Google Drive** node (downloaded file)
- **AWS S3** node (downloaded file)

### Output Binary Property

The processed file will be available in the output binary property, which can be:
- Saved to disk using **Write Binary File** node
- Uploaded to cloud storage
- Sent via email
- Processed by another node

## 🐳 Docker Usage

This node works perfectly in Docker without any modifications:

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    volumes:
      - ~/.n8n:/home/node/.n8n
    # FFmpeg.wasm is included via npm - no need for system FFmpeg
```

No need to install FFmpeg in the container or mount volumes!

## ⚠️ Performance Considerations

### Memory Usage
- FFmpeg.wasm uses WebAssembly memory
- Large files (>500MB) may cause memory issues
- Recommended: Process files in batches if possible

### Processing Speed
- Single-threaded (WebAssembly limitation)
- Slower than native FFmpeg
- Suitable for small to medium files

### Best Practices
1. **File Size**: Keep files under 500MB
2. **Resolution**: Process at lower resolutions when possible
3. **Format**: Use efficient formats (MP4/H.264, WebM/VP9)
4. **Duration**: Trim long videos before processing
5. **Memory**: Monitor container memory limits

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/n8n-nodes-ffmpeg-wasm.git
cd n8n-nodes-ffmpeg-wasm

# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Format code
npm run format
```

### Project Structure

```
n8n-nodes-ffmpeg-wasm/
├── credentials/           # Credential types
│   └── FFmpegWasmApi.credentials.ts
├── nodes/                 # Node implementations
│   ├── FFmpegWasm/
│   │   ├── FFmpegWasm.node.ts
│   │   └── ffmpeg.svg
│   └── index.ts
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

**1. "FFmpeg is not loaded" error**
- The WASM is loading automatically on first use
- Wait a few seconds for initialization

**2. "Out of memory" error**
- File is too large
- Increase Node.js memory: `node --max-old-space-size=4096`
- Process smaller files or lower resolution

**3. "Unsupported format" error**
- Check input file format
- Some formats may not be supported by FFmpeg.wasm

**4. Slow performance**
- This is expected - WASM is slower than native FFmpeg
- Consider using native FFmpeg for batch processing

### Debug Mode

Enable debug logging:

```bash
DEBUG=ffmpeg:* n8n start
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Reporting Issues

Please include:
- n8n version
- Node version
- File format and size
- Error message
- Steps to reproduce

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) - WebAssembly port of FFmpeg
- [n8n](https://n8n.io/) - Workflow automation platform

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/n8n-nodes-ffmpeg-wasm/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/n8n-nodes-ffmpeg-wasm/discussions)
- **Email**: your.email@example.com

---

**Made with ❤️ for the n8n community**
