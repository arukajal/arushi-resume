# Deployment Guide

This guide will help you deploy your interactive 3D resume to get the full experience like your local version.

## Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (if you haven't):
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts** and your site will be live!

## Option 2: Netlify

1. **Go to [netlify.com](https://netlify.com)**
2. **Drag and drop** your entire project folder
3. **Wait for deployment** - it will be live in seconds!

## Option 3: GitHub Pages (Current)

1. **Push your changes** to GitHub
2. **Go to Settings > Pages**
3. **Select "GitHub Actions"** as source
4. **Wait for the workflow to complete**

## Troubleshooting

If the deployed version doesn't show the full interactive experience:

### Check Browser Console
1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Look for errors** - they'll help identify the issue

### Common Issues & Solutions

**Issue**: "Failed to load module"
- **Solution**: Check that your hosting provider supports ES6 modules
- **Try**: Vercel or Netlify instead of basic static hosting

**Issue**: "WebGL not supported"
- **Solution**: This is normal for some browsers/devices
- **Fallback**: The static version will show automatically

**Issue**: Missing controls or panels
- **Solution**: Check if JavaScript is enabled
- **Try**: Different browser or device

### Test Your Deployment

Visit your deployed site and check:
- ✅ All 6 navigation buttons visible
- ✅ Left control panel with sliders/checkboxes
- ✅ Right content panel showing skills/experience
- ✅ 3D cube rotating and interactive
- ✅ Particle effects visible

If any of these are missing, the deployment needs fixing.

## Best Practices

1. **Use modern hosting** (Vercel, Netlify, GitHub Pages)
2. **Test in multiple browsers**
3. **Check mobile compatibility**
4. **Monitor console for errors**

Your local version shows the full experience - the goal is to get the same on the deployed version! 