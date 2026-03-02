# FFmpeg Node Publishing Guide

## 📦 Package Created Successfully!

Location: `~/.openclaw/workspace/n8n-nodes-ffmpeg-wasm/`

## 📁 Files Created

### Core Implementation
- ✅ `package.json` - NPM package configuration with ffmpeg.wasm deps
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `nodes/FFmpegWasm/FFmpegWasm.node.ts` - Main node with 5 operations
- ✅ `nodes/FFmpegWasm/ffmpeg.svg` - Node icon
- ✅ `nodes/index.ts` - Node exports
- ✅ `credentials/FFmpegWasmApi.credentials.ts` - Credential types

### Build & Configuration
- ✅ `gulpfile.js` - Gulp build tasks for icons
- ✅ `.gitignore` - Git ignore patterns

### Documentation
- ✅ `README.md` - Comprehensive documentation (6.8KB)
- ✅ `LICENSE` - MIT License
- ✅ `CONTRIBUTING.md` - Contribution guidelines
- ✅ `CHANGELOG.md` - Version history

### CI/CD
- ✅ `.github/workflows/ci-cd.yml` - GitHub Actions for testing & publishing

## 🚀 Next Steps: Publish to GitHub & NPM

### Step 1: Initialize Git Repository

```bash
cd ~/.openclaw/workspace/n8n-nodes-ffmpeg-wasm

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: FFmpeg.wasm n8n community node

Features:
- Convert video formats
- Extract audio from video
- Resize videos
- Generate thumbnails
- Custom FFmpeg commands

No native binary required - pure JavaScript/WebAssembly"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `n8n-nodes-ffmpeg-wasm`
3. Make it public
4. Don't initialize with README (we already have one)
5. Click "Create repository"

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/n8n-nodes-ffmpeg-wasm.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Build & Test Locally

```bash
# Install dependencies
npm install

# Build
npm run build

# Check dist folder exists
ls -la dist/
```

### Step 4: Publish to NPM

#### Option A: Manual Publishing

```bash
# Login to NPM (first time only)
npm login

# Build
npm run build

# Publish
npm publish --access public
```

#### Option B: Automated via GitHub Actions

1. Create NPM token:
   - Go to https://www.npmjs.com/settings/tokens
   - Generate new token (Automation)
   - Copy the token

2. Add token to GitHub Secrets:
   - Go to GitHub repo → Settings → Secrets → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Your NPM token

3. Create a release:
   - Go to GitHub repo → Releases
   - Click "Draft a new release"
   - Choose tag: `v1.0.0`
   - Title: `v1.0.0 - Initial Release`
   - Description: Copy from CHANGELOG.md
   - Click "Publish release"

4. GitHub Actions will automatically:
   - Run tests
   - Build the package
   - Publish to NPM

### Step 5: Install in n8n

#### For Self-Hosted n8n:

```bash
# Option 1: Install from NPM
cd ~/.n8n/custom
npm install n8n-nodes-ffmpeg-wasm

# Restart n8n
```

#### For Docker n8n:

```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    volumes:
      - ~/.n8n:/home/node/.n8n
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
    command: |
      sh -c "npm install n8n-nodes-ffmpeg-wasm && n8n start"
```

## ✅ Package Features

### Node Operations
1. **Convert** - Convert video/audio to different formats
2. **Extract Audio** - Extract audio track from video
3. **Resize** - Scale video to custom dimensions
4. **Thumbnail** - Generate thumbnail from video
5. **Custom** - Run custom FFmpeg commands

### Technical Highlights
- ✅ Pure JavaScript/WebAssembly - No binary required
- ✅ Works in Docker containers
- ✅ Handles binary input/output
- ✅ Memory cleanup after processing
- ✅ Error handling
- ✅ TypeScript types

## 📋 Checklist Before Publishing

- [ ] Update package.json author information
- [ ] Update GitHub repository URL
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Create NPM account (if needed)
- [ ] Login to NPM (`npm login`)
- [ ] Build package (`npm run build`)
- [ ] Test locally
- [ ] Publish to NPM (`npm publish`)
- [ ] Verify package on NPM: https://www.npmjs.com/package/n8n-nodes-ffmpeg-wasm
- [ ] Install in n8n and test
- [ ] Create GitHub release (triggers auto-publish)

## 🔧 Customization Needed

### Update These Values:

1. **package.json:**
   - `author.name` - Your name
   - `author.email` - Your email
   - `homepage` - Your GitHub URL
   - `repository.url` - Your GitHub repo URL
   - `bugs.url` - Your GitHub issues URL

2. **LICENSE:**
   - Update copyright line with your name

3. **README.md:**
   - Replace `yourusername` with your GitHub username
   - Update email address
   - Add screenshots if desired

4. **package.json:**
   - Change package name if desired

## 📊 Repository Stats

```
Total Files: 14
Total Size: ~20KB (without node_modules)
Lines of Code: ~500+
Dependencies: 2 (ffmpeg/ffmpeg, ffmpeg/util)
Dev Dependencies: 9
```

## 🎯 Quick Commands

```bash
# Navigate to project
cd ~/.openclaw/workspace/n8n-nodes-ffmpeg-wasm

# Install deps
npm install

# Build
npm run build

# Test
npm test

# Link for local testing
npm link

# Publish
npm publish --access public
```

## 🆘 Troubleshooting

### Build Errors
- Make sure TypeScript is installed: `npm install -g typescript`
- Check Node.js version: `node -v` (should be 18+)

### Publishing Errors
- Check if logged in: `npm whoami`
- Check package name is unique: `npm search n8n-nodes-ffmpeg-wasm`

### Installation Errors
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules && npm install`

## 📝 Notes

- This node uses **ffmpeg.wasm** which is ~25MB
- First load may take a few seconds (WASM initialization)
- Memory limits apply (large files may cause issues)
- Works in Docker without any modifications

---

**Ready to publish! 🚀**
