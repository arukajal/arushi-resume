
(function() {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') || 'dark';
  if (saved === 'light') root.classList.add('light');
  btn.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  // Try to load avatar.jpg; if it loads, show it and hide the SVG fallback
  const img = document.querySelector('.avatar-img');
  const svgFallback = document.querySelector('.avatar-svg');
  if (img) {
    const test = new Image();
    test.onload = () => { img.style.display = 'block'; if (svgFallback) svgFallback.style.display = 'none'; };
    test.onerror = () => { /* keep fallback */ };
    test.src = img.getAttribute('src');
  }

})();
