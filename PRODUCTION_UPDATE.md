# Production Update Guide

## Updating to Gemini-Only Version

This guide explains how to update your production environment after removing the OCR dependency.

### Step 1: Pull Latest Changes

```bash
# SSH into your production server
ssh user@your-server

# Navigate to your app directory
cd /path/to/shop_assistant

# Pull the latest changes
git pull origin main
```

### Step 2: Remove Old Dependencies

```bash
# Remove node_modules to ensure clean install
rm -rf node_modules

# Remove package-lock.json to regenerate it
rm -f package-lock.json

# Clean npm cache (optional but recommended)
npm cache clean --force
```

### Step 3: Install Updated Dependencies

```bash
# Install dependencies (this will NOT install ocr-space-api-wrapper)
npm install
```

### Step 4: Update Environment Variables

```bash
# Edit your .env file
nano .env  # or vim .env

# Remove these lines (if they exist):
# PRICETAG_EXTRACTION_BACKEND=gemini_fallback
# OCRSPACE_API_KEY=your_key

# Make sure you have:
# GEMINI_API_KEY=your_gemini_api_key_here
# GEMINI_MODEL=gemini-2.0-flash-lite
```

### Step 5: Rebuild the Application

```bash
# Run the deployment script
./scripts/deploy.sh
```

This will:
- Clean previous builds
- Install dependencies
- Build the client
- Copy files to server/public
- Stop any existing server

### Step 6: Start the Server

```bash
# Start the server
./scripts/app.sh start

# Or start in background
./scripts/app.sh start-bg
```

### Step 7: Verify the Update

```bash
# Check if server is running
./scripts/app.sh status

# Check logs for any errors
./scripts/app.sh logs

# Test the application
curl http://localhost:3000/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Step 8: Test Price Tag Scanning

1. Open the app in your browser
2. Create a new shopping list
3. Click the camera button
4. Take a photo of a price tag
5. Verify that Gemini AI extracts the product info correctly

---

## Quick Update Script

For convenience, here's a one-liner to update everything:

```bash
git pull && rm -rf node_modules package-lock.json && npm install && ./scripts/deploy.sh && ./scripts/app.sh restart-bg
```

---

## Troubleshooting

### Issue: "Cannot find module 'ocr-space-api-wrapper'"

**Solution:** The old module is still cached. Run:
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

### Issue: Server won't start

**Solution:** Check if the port is already in use:
```bash
lsof -ti:3000
# If a PID is returned, kill it:
kill -9 <PID>
```

### Issue: Gemini API errors

**Solution:** Verify your API key:
```bash
# Check .env file
cat .env | grep GEMINI_API_KEY

# Test the API key
curl -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=YOUR_API_KEY"
```

### Issue: Build fails

**Solution:** Check Node.js version:
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

If outdated, update Node.js:
```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

---

## Rollback (if needed)

If you need to rollback to the previous version:

```bash
# Find the previous commit
git log --oneline -5

# Rollback to previous commit (replace COMMIT_HASH)
git reset --hard <COMMIT_HASH>

# Reinstall dependencies
rm -rf node_modules
npm install

# Redeploy
./scripts/deploy.sh
./scripts/app.sh restart-bg
```

---

## Monitoring After Update

Monitor your application for the first few hours:

```bash
# Watch logs in real-time
tail -f logs/app.log

# Check for errors
tail -f logs/error.log

# Monitor server status
watch -n 5 './scripts/app.sh status'
```

---

## Performance Notes

After removing OCR:
- ✅ Smaller bundle size (10 fewer packages)
- ✅ Faster installation
- ✅ Better accuracy with Gemini AI
- ✅ Simpler configuration
- ⚠️ Requires Gemini API key (paid service)

---

## Support

If you encounter issues:
1. Check logs: `./scripts/app.sh logs`
2. Verify environment: `cat .env`
3. Test API: `curl http://localhost:3000/api/health`
4. Check GitHub issues or create a new one
