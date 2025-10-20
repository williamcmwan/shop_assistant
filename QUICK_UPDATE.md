# Quick Production Update

## One-Command Update

```bash
./scripts/update-production.sh
```

This script will automatically:
1. ✅ Stop the server
2. ✅ Pull latest changes
3. ✅ Remove old dependencies (including ocr-space-api-wrapper)
4. ✅ Install fresh dependencies
5. ✅ Rebuild the application
6. ✅ Restart the server
7. ✅ Verify everything works

---

## Manual Update (Step by Step)

If you prefer to do it manually:

```bash
# 1. Stop server
./scripts/app.sh stop

# 2. Pull changes
git pull origin main

# 3. Clean dependencies
rm -rf node_modules package-lock.json
npm cache clean --force

# 4. Install fresh
npm install

# 5. Rebuild
./scripts/deploy.sh

# 6. Start server
./scripts/app.sh start-bg

# 7. Check status
./scripts/app.sh status
```

---

## Environment Variables

Make sure your `.env` has:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-lite
PORT=3000
NODE_ENV=production
```

**Remove these (no longer needed):**
- ~~PRICETAG_EXTRACTION_BACKEND~~
- ~~OCRSPACE_API_KEY~~

---

## Verify Update

```bash
# Check server status
./scripts/app.sh status

# View logs
./scripts/app.sh logs

# Test API
curl http://localhost:3000/api/health
```

---

## Troubleshooting

**Module not found error?**
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

**Server won't start?**
```bash
# Check what's using the port
lsof -ti:3000

# Kill it if needed
kill -9 $(lsof -ti:3000)
```

**Check logs:**
```bash
./scripts/app.sh logs error
```

---

## Rollback

If something goes wrong:

```bash
git log --oneline -5  # Find previous commit
git reset --hard <commit-hash>
rm -rf node_modules
npm install
./scripts/deploy.sh
./scripts/app.sh restart-bg
```
