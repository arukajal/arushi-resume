# Resume Website

A clean, responsive, and accessible resume website for **Arushi Singh** built with plain HTML, CSS, and a little JS.

## How to use

1. Download and unzip the package.
2. Open `index.html` in your browser to preview locally.

## Deploy (GitHub Pages)

1. Create a new public repository (e.g., `arushi-resume`).
2. Commit the files and push.
3. In **Settings → Pages**, set the source to `Deploy from a branch`, branch `main`, folder `/root`.
4. Your site will be live at `https://<your-username>.github.io/arushi-resume/`.

## Deploy (Netlify)

1. Drag & drop the folder into https://app.netlify.com/drop (or connect your repo).
2. Netlify assigns a URL you can customize.

## Customize

- Update text in `index.html` (summary, experience, education).
- Change colors in `styles.css` (see CSS variables at the top).
- The avatar is an inline SVG with initials — replace it with your photo if you prefer.
- The site includes JSON-LD structured data for better SEO.

## Notes

- No external build steps required.
- Works offline (fonts load from Google Fonts if online; otherwise system fonts will be used).


---

## Swap the avatar photo
Place a square headshot at:
```
assets/avatar.jpg
```
Recommended size: 512×512 or 1024×1024 (JPG). The page will automatically show your photo if the file exists, otherwise it falls back to the initials SVG.

## Deploy to GitHub Pages (step-by-step)

1. Create a new public repository on GitHub, e.g. `arushi-resume`.
2. Download this ZIP and extract it.
3. Initialize a repo and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/arushi-resume.git
   git push -u origin main
   ```
4. In GitHub, go to **Settings → Pages**.
5. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
6. Choose **Branch:** `main` and **Folder:** `/root` (or `/`).
7. Click **Save**. In ~1 minute, your site will be live at:
   ```
   https://<your-username>.github.io/arushi-resume/
   ```

To update the site later, commit changes and push to `main` again.
