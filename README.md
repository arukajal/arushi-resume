# Interactive 3D Resume (Three.js)

An interactive 3D resume built with Three.js showcasing Arushi Singh's software engineering experience.

## Features
- 3D resume cube with clickable faces: Profile, Skills, Experience, Projects, Education, Contact
- Hover highlight + smooth rotation to the chosen section
- Content panel updates from `data.json`
- Drop your headshot at `assets/avatar.jpg` (square JPG) to show it on the Profile face
- Dark/light theme toggle
- Accessible HTML fallback for screen readers / no WebGL
- Particle effects and interactive controls

## Local Development
Open `index.html` in a browser (internet required for fonts).

## Deployment

### GitHub Pages
1. Push your code to a GitHub repository
2. Go to Settings > Pages
3. Select "GitHub Actions" as the source
4. The workflow will automatically deploy your site

### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command to empty (static site)
3. Set publish directory to `/` (root)
4. Deploy!

### Testing
Visit `/test.html` to run diagnostic tests for WebGL support and asset loading.

## Customize
- Edit text in `data.json`
- Tweak visuals in `styles.css` and `app.js`
- Update avatar in `assets/avatar.jpg`

## Troubleshooting
If the 3D content doesn't load:
1. Check browser console for errors
2. Visit `/test.html` to diagnose issues
3. Ensure all files are properly uploaded
4. Check that your hosting provider supports ES6 modules
