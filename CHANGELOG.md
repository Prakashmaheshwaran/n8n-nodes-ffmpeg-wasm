# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.9] - 2026-03-05

### Fixed
- Fixed SVG icon path in build output - icon now correctly displays in n8n UI
- Updated gulp build configuration to place icons in correct directory structure

## [1.1.0] - 2026-03-02

### Added
- **Media Info** operation: Extract metadata (duration, resolution, codec, bitrate) as JSON
- **Remux** operation: Fast container format change without re-encoding
- **Social Media Preset** operation: One-click optimization for YouTube, Instagram, TikTok, Twitter
- **Compress to Size** operation: Compress video to a target file size
- **Merge Videos** operation: Concatenate multiple videos with optional fade effect
- **Trim/Cut** operation: Extract video segments by time range
- **Video Filters** operation: Brightness, contrast, saturation, blur, grayscale, sepia
- **Speed Adjustment** operation: 0.25x to 4x with proper audio sync
- **Rotate/Flip** operation: 90/180/270 degree rotation and horizontal/vertical flip
- **Audio Mix** operation: Mix multiple audio tracks into one
- **Audio Filters** operation: Volume, bass, treble, high/low pass filters
- **Audio Normalize** operation: LUFS loudness normalization
- **Video Overlay** operation: Watermark and picture-in-picture with opacity
- **Subtitle Burn-in** operation: SRT/ASS/VTT subtitle embedding
- **GIF/WebP Animation** operation: Animated GIF/WebP with palette optimization
- **Image Sequence Export** operation: Export frames as individual images
- Codec selection (H.264, H.265, VP9) and CRF quality control for Convert operation
- Credential support for custom FFmpeg WASM core/wasm/worker URLs
- Timeout enforcement on FFmpeg operations
- Proper MIME type detection for output files
- Unit tests for helper utilities (25 tests)
- ESLint, Prettier, and Jest configuration files
- Extracted helper utilities into `helpers.ts` for maintainability

### Fixed
- Image Sequence operation now correctly reads multiple frame output files
- 180-degree rotation now uses two separate transpose filters instead of invalid combined value
- Video Filters `eq` parameters (brightness, contrast, saturation) combined into single filter to prevent overrides
- Speed adjustment uses chained `atempo` filters for speeds outside 0.5-2.0 range (4x, 0.25x)
- Subtitle font colors converted to proper ASS `&HBBGGRR&` format with named color support
- GIF creation uses `-filter_complex` instead of `-vf` for palettegen/paletteuse pipeline
- Input files written with proper extensions for FFmpeg format detection
- Overlay files written with proper extensions
- Merge input files derive extensions from binary metadata instead of hardcoding `.mp4`
- Audio Mix input files derive extensions from binary metadata instead of hardcoding `.wav`
- FFmpeg instance properly terminated with `ffmpeg.terminate()` instead of invalid `deleteFile(".")`
- PiP overlay now mixes both audio tracks; watermark copies only main audio
- Output MIME types correctly computed from output format instead of inheriting input MIME
- Log listener registered once before item loop instead of per-item (prevents listener leak)

### Changed
- Merge "Add Transition" option renamed to "Add Fade Effect" with accurate description
- Speed operation removes the no-op "1x (Normal)" option
- Credential types use `INodeProperties[]` instead of `NodePropertyTypes` cast
- Removed unused `@ffmpeg/util` dependency
- Fixed `package.json` main field to point to correct path
- Peer dependency `n8n-workflow` now requires `>=1.0.0` instead of wildcard

## [1.0.0] - 2024-03-01

### Added
- Initial release
- FFmpeg.wasm integration for pure JavaScript video/audio processing
- Support for operations: Convert, Extract Audio, Resize, Thumbnail, Custom
- Binary input/output support for n8n workflows
- TypeScript implementation
- MIT License
- GitHub Actions CI/CD pipeline

[Unreleased]: https://github.com/Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Prakashmaheshwaran/n8n-nodes-ffmpeg-wasm/releases/tag/v1.0.0
