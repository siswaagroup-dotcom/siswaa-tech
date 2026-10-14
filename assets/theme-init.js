/* Runs before first paint so a saved light/dark choice doesn't flash. Kept as a file (not inline) so the Content-Security-Policy can block inline scripts. */
try {
  var t = localStorage.getItem('siswaa-theme');
  if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
