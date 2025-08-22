# Deployment Checklist

## Before Deploying ✅

1. **Run build script**:
   ```bash
   npm run build
   ```

2. **Verify version numbers updated**:
   - Check `index.html` has new timestamps
   - CSS: `styles.css?v1755862316046` (should be different each time)
   - JS: `app.js?v1755862316046` (should be different each time)

3. **Check files are ready**:
   - ✅ `index.html` updated
   - ✅ `app.js` unchanged (your main code)
   - ✅ `styles.css` unchanged (your styles)
   - ✅ `netlify.toml` configured
   - ✅ `_headers` configured

## Deploy 🚀

1. **Push to Git repository** (if using Git-based deployment)
2. **Wait for deployment to complete**
3. **Check deployment logs for success**

## After Deploying ✅

1. **Test the deployed site**:
   - Open in new incognito/private window
   - Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Check browser console (F12) for errors

2. **Verify latest version**:
   - 3D cube should be visible and interactive
   - All 6 navigation buttons should work
   - Controls panel should be visible
   - Content panel should show information

## If Still Not Working ❌

1. **Clear browser cache completely**
2. **Try different browser/device**
3. **Check deployment platform logs**
4. **Verify build script ran successfully**
5. **Check version numbers in deployed HTML**

## Quick Commands

```bash
# Update cache busting
npm run build

# Check current versions
grep "styles.css?v" index.html
grep "app.js?v" index.html

# Deploy (after build)
git add .
git commit -m "Update cache busting versions"
git push
```
