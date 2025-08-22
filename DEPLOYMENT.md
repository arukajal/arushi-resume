# Deployment Guide

## Quick Deploy

1. **Run the build script** (this updates cache-busting versions):
   ```bash
   npm run build
   ```

2. **Deploy to your platform**:
   - **Netlify**: Push to your connected Git repository
   - **Vercel**: Push to your connected Git repository
   - **Manual**: Upload the updated files

## Cache Busting

The build script automatically updates version numbers in `index.html`:
- CSS: `styles.css?v=20241201` → `styles.css?v=1701234567890`
- JS: `app.js?v=20241201` → `app.js?v=1701234567890`

## Troubleshooting "Not Getting Latest Page"

### 1. Force Cache Refresh
- **Hard refresh**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Clear browser cache**: Clear all site data for your domain
- **Incognito mode**: Test in a private/incognito browser window

### 2. Check Deployment Status
- Verify your deployment pipeline completed successfully
- Check deployment logs for any errors
- Ensure the build script ran and updated version numbers

### 3. Verify File Changes
- Check that `index.html` has new version numbers
- Confirm `app.js` and `styles.css` are updated
- Look for the build timestamp in the HTML file

### 4. Platform-Specific Issues

#### Netlify
- Check `netlify.toml` configuration
- Verify build command: `npm run build`
- Check deploy logs in Netlify dashboard

#### Vercel
- Check `vercel.json` configuration
- Verify build settings in Vercel dashboard
- Check deploy logs

### 5. Manual Cache Busting
If automatic cache busting fails:
```bash
# Manually update version numbers
sed -i 's/styles\.css?v=[^"]*/styles.css?v='$(date +%s)'/g' index.html
sed -i 's/app\.js?v=[^"]*/app.js?v='$(date +%s)'/g' index.html
```

## File Structure
```
├── index.html          # Main HTML file (auto-updated)
├── app.js             # Main JavaScript (Three.js app)
├── styles.css         # CSS styles
├── build.js           # Build script for cache busting
├── netlify.toml      # Netlify configuration
├── _headers           # HTTP headers for caching
└── package.json       # NPM scripts
```

## Common Issues

1. **Old version showing**: Run `npm run build` before deploying
2. **CSS not updating**: Check cache headers and version numbers
3. **JS not updating**: Verify module loading and version numbers
4. **Deployment fails**: Check build script and platform configuration

## Support
If issues persist:
1. Check browser developer tools (F12) for errors
2. Verify network requests show new version numbers
3. Test in multiple browsers/devices
4. Check platform-specific deployment logs 