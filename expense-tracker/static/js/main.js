document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const modeIcon = themeToggle.querySelector('.mode-icon');

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        modeIcon.textContent = '☀️';
    } else {
        modeIcon.textContent = '🌙';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        modeIcon.textContent = isDark ? '☀️' : '🌙';
        
        // Update Chart colors if they exist
        if (typeof Chart !== 'undefined') {
            updateChartTheme(isDark);
        }
    });

    function updateChartTheme(isDark) {
        const inkColor = isDark ? '#f7f6f3' : '#0f0f0f';
        const mutedColor = isDark ? '#a0a0a0' : '#6b6b6b';

        Chart.helpers.each(Chart.instances, (instance) => {
            const options = instance.options;

            // Update scale colors
            if (options.scales) {
                if (options.scales.x) {
                    options.scales.x.ticks.color = mutedColor;
                }
                if (options.scales.y) {
                    options.scales.y.ticks.color = mutedColor;
                    options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
                }
            }

            // Update legend colors
            if (options.plugins && options.plugins.legend) {
                options.plugins.legend.labels.color = inkColor;
            }

            instance.update();
        });
    }
});
