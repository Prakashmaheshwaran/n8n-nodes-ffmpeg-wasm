# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # tsc + gulp build:icons (SVG optimization into dist/)
npm run dev          # tsc --watch
npm test             # jest (all __tests__/**/*.test.ts under nodes/)
npm run lint         # eslint nodes credentials package.json
npm run lintfix      # eslint --fix
npm run format       # prettier --write on nodes/ and credentials/
```

Run a single test file:
```bash
npx jest nodes/FFmpegWasm/__tests__/helpers.test.ts
```

## Architecture

This is an **n8n community node** that exposes FFmpeg media processing via WebAssembly (`@ffmpeg/ffmpeg` v0.11.x). No native binary is required.

### Execution flow

1. `FFmpegWasm.node.ts` — The n8n `INodeType` implementation. It initializes the FFmpeg WASM instance (one per item), reads binary input from n8n's virtual FS, delegates to an operation handler, then writes the output binary back.
2. `operations/` — Each file groups related handlers. Every handler receives a `HandlerParams` object containing the `ffmpeg` instance, the n8n execution context (`ctx`), item index, and pre-computed input/output filenames. Handlers return a `CommandResult` (with the FFmpeg arg array, output extension, and temp files to clean up) or a specialized result type for metadata/image-sequences.
3. `helpers.ts` — Pure utility functions: MIME↔extension mapping, metadata log parsing (`parseMetadataFromLogs`), ASS subtitle color conversion, atempo filter chaining, and `SOCIAL_MEDIA_PRESETS`.
4. `types.ts` — Shared interfaces (`HandlerParams`, `CommandResult`, `FFmpegInstance`, etc.) and the `isX264Format` helper.
5. `credentials/FFmpegWasmApi.credentials.ts` — Optional credential that lets users override the CDN URL for `ffmpeg-core.js`.

### Operation modules

| File | Operations |
|------|-----------|
| `convert.ts` | `handleConvert`, `handleRemux` |
| `audio.ts` | `handleExtractAudio`, `handleAudioMix`, `handleAudioFilters`, `handleAudioNormalize` |
| `video.ts` | `handleResize`, `handleThumbnail`, `handleVideoFilters`, `handleSpeed`, `handleRotate` |
| `merge.ts` | `handleMerge` (concat via concat demuxer) |
| `advanced.ts` | `handleOverlay`, `handleSubtitle`, `handleGif`, `handleImageSequence`, `readImageSequenceFrames` |
| `presets.ts` | `handleSocialMedia`, `handleCompressToSize` |
| `metadata.ts` | `handleMetadata` (parses FFmpeg stderr, no output file) |
| `custom.ts` | `handleCustom` (raw FFmpeg args from user) |

### Build output

`npm run build` compiles TypeScript to `dist/` and copies optimized SVGs there via `gulpfile.js`. The n8n `"n8n"` block in `package.json` points to `dist/` paths — n8n loads nodes from there at runtime.

### Testing

Tests live in `nodes/FFmpegWasm/__tests__/`. They cover pure helper functions and operation logic using `ts-jest`. The FFmpeg WASM instance itself is mocked in tests since it cannot run in a Node test environment.
