# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-03-01

### Added
- Initial release
- FFmpeg.wasm integration for pure JavaScript video/audio processing
- Support for operations: Convert, Extract Audio, Resize, Thumbnail, Custom
- Binary input/output support for n8n workflows
- TypeScript implementation
- MIT License
- GitHub Actions CI/CD pipeline
- Comprehensive documentation

### Features
- **Convert**: Convert between video formats (MP4, WebM, MOV, AVI, etc.)
- **Extract Audio**: Extract audio tracks from video (MP3, AAC, WAV, OGG)
- **Resize**: Scale videos to custom dimensions
- **Thumbnail**: Generate thumbnails from video timestamps
- **Custom**: Execute custom FFmpeg commands

### Technical
- No native FFmpeg binary required
- WebAssembly-based processing
- Memory-efficient virtual filesystem
- Automatic cleanup after processing
- Docker-compatible

[1.0.0]: https://github.com/yourusername/n8n-nodes-ffmpeg-wasm/releases/tag/v1.0.0
