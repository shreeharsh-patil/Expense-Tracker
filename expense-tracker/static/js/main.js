// Unified post-navigation handler (Turbo Drive + standard page loads)
function onPageReady() {
  const isDark = document.documentElement.classList.contains('dark');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  if (themeToggleIcon) {
    themeToggleIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  }

  // Auto-dismiss flash notifications after 5 seconds
  document.querySelectorAll('.flash-message').forEach((msg) => {
    if (msg.dataset.autoDismissed) return;
    msg.dataset.autoDismissed = 'true';
    setTimeout(() => {
      msg.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-12px)';
      setTimeout(() => msg.remove(), 500);
    }, 5000);
  });

  // Re-run chart rendering if chart global exists
  if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
  if (typeof renderReportCharts === 'function') renderReportCharts();
}

document.addEventListener('DOMContentLoaded', onPageReady);

// Use event delegation for all button clicks to avoid detached listener issues with Turbo Drive
document.addEventListener('click', (e) => {
  // Theme Toggler
  const themeToggle = e.target.closest('#theme-toggle');
  if (themeToggle) {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    if (themeToggleIcon) {
      themeToggleIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
    // Dispatch event to redraw charts
    window.dispatchEvent(new Event('theme-changed'));
    return;
  }

  // Hamburger Menu
  const hamburger = e.target.closest('#nav-hamburger');
  if (hamburger) {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) {
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
    }
    return;
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
  // Fix for Chart.js v4+ font resolution
  Chart.defaults.color = '#475569';
}