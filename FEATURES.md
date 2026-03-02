# FFmpeg.wasm Node Feature List

A comprehensive feature list for the n8n FFmpeg.wasm community node. This document outlines practical video/audio processing capabilities that can be implemented for automation workflows.

---

## 1. Video Operations

### 1.1 Convert Format

**Description:** Convert media files between different video formats (MP4, WebM, AVI, MOV, MKV, etc.).
**Use Case:** Standardize video uploads to a single format for storage or compatibility.
**Parameters:** Output format, codec selection (H.264, H.265, VP9), quality preset.

### 1.2 Extract Frame/Thumbnail

**Description:** Extract a single frame at a specific timestamp to create a thumbnail image (JPG, PNG, WebP).
**Use Case:** Generate preview thumbnails for video galleries or social media posts.
**Parameters:** Timestamp, output dimensions, image quality, format.

### 1.3 Resize/Scale Video

**Description:** Change video resolution while optionally maintaining aspect ratio.
**Use Case:** Create multiple size variants for responsive web delivery (480p, 720p, 1080p).
**Parameters:** Width, height, aspect ratio preservation, scaling algorithm.

### 1.4 Trim/Cut Video

**Description:** Extract a segment from a video by specifying start and end timestamps.
**Use Case:** Remove intros/outros, create clips from longer videos, or split content.
**Parameters:** Start time, end time or duration, accurate seeking option.

### 1.5 Video Merge/Concatenate

**Description:** Join multiple video files sequentially into a single output.
**Use Case:** Combine video segments, add bumpers or trailers to main content.
**Parameters:** Input order, transition handling, re-encoding options.

### 1.6 Video Overlay

**Description:** Overlay an image or video on top of another video (watermark, logo, picture-in-picture).
**Use Case:** Add branding watermarks, create reaction videos, or add annotations.
**Parameters:** Overlay position (x, y), size, transparency/opacity, start/end time.

### 1.7 Video Filters

**Description:** Apply visual effects including blur, sharpen, denoise, brightness/contrast adjustments.
**Use Case:** Enhance video quality, apply artistic effects, or fix exposure issues.
**Parameters:** Filter type, intensity/strength values, region of interest.

### 1.8 Speed Adjustment

**Description:** Change video playback speed (slow motion, time-lapse) while optionally adjusting audio pitch.
**Use Case:** Create slow-motion highlights or condense long content into summaries.
**Parameters:** Speed multiplier (0.5x - 4x), audio pitch correction toggle.

---

## 2. Audio Operations

### 2.1 Extract Audio

**Description:** Extract audio track from video files to common formats (MP3, AAC, WAV, OGG, FLAC).
**Use Case:** Create podcast episodes from video content or extract music tracks.
**Parameters:** Output format, bitrate/quality, sample rate, channel configuration.

### 2.2 Audio Normalization

**Description:** Adjust audio levels to a standard loudness (LUFS) to ensure consistent volume.
**Use Case:** Normalize audio across multiple files for professional playback.
**Parameters:** Target loudness level (e.g., -14 LUFS for streaming), true peak limit.

### 2.3 Audio Mixing

**Description:** Mix multiple audio tracks or merge separate audio with video.
**Use Case:** Add background music, combine voiceover with video, or create audio montages.
**Parameters:** Audio levels/volume per track, fade in/out, mixing mode.

### 2.4 Audio Filters

**Description:** Apply audio effects including noise reduction, equalization, compression, and reverb.
**Use Case:** Clean up recordings, enhance voice clarity, or add audio effects.
**Parameters:** Filter type, effect parameters, frequency ranges.

---

## 3. Format Conversion Options

### 3.1 Container Conversion

**Description:** Change container format without re-encoding (fast remuxing) when possible.
**Use Case:** Quick format changes for compatibility without quality loss.
**Parameters:** Target container, copy vs. re-encode decision.

### 3.2 Codec Transcoding

**Description:** Convert between different video/audio codecs with quality and compression control.
**Use Case:** Optimize file sizes for web delivery or device compatibility.
**Parameters:** Video codec (H.264, H.265, AV1), audio codec (AAC, Opus), CRF/quality level.

### 3.3 GIF/WebP Animation Creation

**Description:** Convert video segments to animated GIF or WebP for web use.
**Use Case:** Create shareable animated content for social media or documentation.
**Parameters:** Frame rate, color palette size, dithering options, loop count.

### 3.4 Image Sequence Export

**Description:** Extract all frames from a video as a sequence of images.
**Use Case:** Frame-by-frame analysis, create stop-motion, or extract for editing.
**Parameters:** Frame rate/fps, output format (PNG, JPG), naming pattern.

---

## 4. Advanced Features

### 4.1 Video Stabilization

**Description:** Apply digital stabilization to reduce camera shake and smooth motion.
**Use Case:** Fix handheld footage, improve professional appearance of recordings.
**Parameters:** Stabilization strength, smoothing window, crop vs. zoom.

### 4.2 Screen Recording Processing

**Description:** Optimize and compress screen recordings with specific settings for text clarity.
**Use Case:** Prepare tutorial videos, documentation recordings for web upload.
**Parameters:** Codec optimized for screen content, bitrate, keyframe interval.

### 4.3 Subtitle Burn-in

**Description:** Embed subtitle files (SRT, VTT, ASS) directly into the video frames.
**Use Case:** Create videos with permanent captions for platforms without subtitle support.
**Parameters:** Subtitle file, font styling, position, encoding format.

### 4.4 Video Metadata Extraction

**Description:** Extract technical metadata including codec info, duration, bitrate, resolution.
**Use Case:** Catalog media assets, validate uploaded files, or generate reports.
**Parameters:** Metadata fields to extract, output format (JSON, XML).

### 4.5 Batch Processing Support

**Description:** Process multiple files in a single execution with consistent settings.
**Use Case:** Apply the same transformation to an entire folder of media files.
**Parameters:** Batch size limits, parallel processing, error handling mode.

---

## 5. URL-Based Processing Capabilities

### 5.1 Direct URL Input

**Description:** Process media files directly from URLs without downloading first.
**Use Case:** Automate processing of remote media assets from CDNs or storage services.
**Parameters:** Source URL, authentication headers, timeout settings.

### 5.2 Streaming Output

**Description:** Generate output suitable for adaptive streaming (HLS, DASH segments).
**Use Case:** Prepare content for web streaming platforms or CDN distribution.
**Parameters:** Segment duration, playlist type, multiple quality variants.

### 5.3 Social Media Optimization

**Description:** Pre-configured settings optimized for specific platforms (YouTube, Instagram, TikTok, Twitter).
**Use Case:** Automatically format videos to meet platform requirements.
**Parameters:** Platform preset, aspect ratio, maximum file size, codec preferences.

---

## 6. Binary File Handling

### 6.1 Binary Property Input/Output

**Description:** Accept media files via n8n binary properties and return processed binary data.
**Use Case:** Seamless integration with file storage nodes (S3, Google Drive, Dropbox).
**Parameters:** Input binary property name, output binary property name, mime-type handling.

### 6.2 File Size Optimization

**Description:** Compress videos to meet specific file size constraints for email or upload limits.
**Use Case:** Ensure attachments fit email limits or platform upload restrictions.
**Parameters:** Target file size, maximum bitrate, two-pass encoding.

### 6.3 Multi-track Audio Handling

**Description:** Process files with multiple audio tracks (languages, commentary, surround sound).
**Use Case:** Extract specific language tracks or create multi-language outputs.
**Parameters:** Track selection, language preference, channel mapping.

---

## Implementation Notes

### WASM Considerations

- All operations run client-side via FFmpeg.wasm for security and privacy
- File size limitations apply based on available memory
- Processing time depends on client hardware capabilities

### Error Handling

- Graceful handling of unsupported formats or codecs
- Timeout management for long-running operations
- Progress reporting for large file processing

### Future Enhancements

- Hardware acceleration support (where available)
- Cloud processing fallback for large files
- Integration with AI-based video analysis tools
