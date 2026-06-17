document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('hidden');
      const spans = hamburger.querySelectorAll('span');
      if (!navLinks.classList.contains('hidden')) {
        spans[0].style.transform = 'rotate(45deg) translate(4px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(4px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // Theme Toggler Button Logic
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');

  function updateThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    if (themeToggleIcon) {
      themeToggleIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeUI();
      // Dispatch event to redraw charts
      window.dispatchEvent(new Event('theme-changed'));
    });
    // Initialize UI state
    updateThemeUI();
  }
});

// Define getChartThemeColors globally so it is immediately available when downstream scripts parse.
window.getChartThemeColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    tickColor: isDark ? '#9ca3af' : '#475569',
    titleColor: isDark ? '#f9fafb' : '#0f172a',
    primaryColor: isDark ? '#a5b4fc' : '#4f46e5',
    secondaryColor: '#f43f5e', // modern rose/coral
    cardColor: isDark ? '#0b0f19' : '#ffffff',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipText: isDark ? '#f9fafb' : '#0f172a',
    palette: ['#4f46e5', '#f43f5e', '#0f766e', '#fbbf24', '#fb923c', '#2dd4bf', '#d97706'] // Indigo, Rose, Teal, Amber, Peach, Mint, Mustard
  };
};

if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "'Fragment Mono', monospace";
  Chart.defaults.font.size = 10;
}