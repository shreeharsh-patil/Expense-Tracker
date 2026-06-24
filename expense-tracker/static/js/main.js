function onPageReady() {
  const isDark = document.documentElement.classList.contains('dark');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  if (themeToggleIcon) {
    themeToggleIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
  }

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

  if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
  if (typeof renderReportCharts === 'function') renderReportCharts();
}

document.addEventListener('DOMContentLoaded', onPageReady);

document.addEventListener('click', (e) => {
  const themeToggle = e.target.closest('#theme-toggle');
  if (themeToggle) {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    if (themeToggleIcon) {
      themeToggleIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
    window.dispatchEvent(new Event('theme-changed'));
    return;
  }

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

  const toggleBtn = e.target.closest('.toggle-password');
  if (toggleBtn) {
    const targetId = toggleBtn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggleBtn.querySelector('.material-symbols-outlined').textContent = isPassword ? 'visibility_off' : 'visibility';
    }
    return;
  }
});

document.addEventListener('input', (e) => {
  const passwordInput = e.target.closest('#reg-password');
  if (passwordInput) {
    updatePasswordStrength(passwordInput.value);
  }

  const confirmInput = e.target.closest('#reg-confirm-password');
  if (confirmInput) {
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('confirm-password-error');
    if (confirmInput.value && confirmInput.value !== password) {
      errorEl.classList.remove('hidden');
      confirmInput.classList.add('border-accent-red', 'focus:border-accent-red');
    } else {
      errorEl.classList.add('hidden');
      confirmInput.classList.remove('border-accent-red', 'focus:border-accent-red');
    }
  }
});

document.addEventListener('submit', (e) => {
  const loginForm = e.target.closest('#login-form');
  if (loginForm) {
    e.preventDefault();
    if (validateLoginForm(loginForm)) {
      setLoading(loginForm.querySelector('#login-submit'), true);
      loginForm.submit();
    }
    return;
  }

  const registerForm = e.target.closest('#register-form');
  if (registerForm) {
    e.preventDefault();
    if (validateRegisterForm(registerForm)) {
      setLoading(registerForm.querySelector('#register-submit'), true);
      registerForm.submit();
    }
    return;
  }
});

function updatePasswordStrength(password) {
  const bar = document.getElementById('password-strength-bar');
  const label = document.getElementById('password-strength-label');
  if (!bar || !label) return;

  const segments = bar.querySelectorAll('div');
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) strength++;

  const colors = ['', 'bg-accent-red', 'bg-orange-400', 'bg-yellow-400', 'bg-primary'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  segments.forEach((seg, i) => {
    seg.className = `h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength] : 'bg-slate-200 dark:bg-dark-border'}`;
  });
  label.textContent = strength > 0 ? labels[strength] : '';
}

function validateLoginForm(form) {
  const email = form.querySelector('#login-email');
  const password = form.querySelector('#login-password');
  const emailError = document.getElementById('login-email-error');
  const passwordError = document.getElementById('login-password-error');
  let valid = true;

  emailError.classList.add('hidden');
  passwordError.classList.add('hidden');
  email.classList.remove('border-accent-red');
  password.classList.remove('border-accent-red');

  if (!email.value || !/^[^@]+@[^@]+\.[^@]+$/.test(email.value)) {
    emailError.classList.remove('hidden');
    email.classList.add('border-accent-red');
    valid = false;
  }
  if (!password.value) {
    passwordError.classList.remove('hidden');
    password.classList.add('border-accent-red');
    valid = false;
  }
  return valid;
}

function validateRegisterForm(form) {
  const name = form.querySelector('#name');
  const email = form.querySelector('#reg-email');
  const password = form.querySelector('#reg-password');
  const confirm = form.querySelector('#reg-confirm-password');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('reg-email-error');
  const passwordError = document.getElementById('reg-password-error');
  const confirmError = document.getElementById('confirm-password-error');
  let valid = true;

  [nameError, emailError, passwordError, confirmError].forEach(el => el.classList.add('hidden'));
  [name, email, password, confirm].forEach(el => el.classList.remove('border-accent-red'));

  if (!name.value || name.value.length < 2) {
    nameError.classList.remove('hidden');
    name.classList.add('border-accent-red');
    valid = false;
  }
  if (!email.value || !/^[^@]+@[^@]+\.[^@]+$/.test(email.value)) {
    emailError.classList.remove('hidden');
    email.classList.add('border-accent-red');
    valid = false;
  }
  if (!password.value || password.value.length < 6) {
    passwordError.classList.remove('hidden');
    password.classList.add('border-accent-red');
    valid = false;
  }
  if (password.value !== confirm.value) {
    confirmError.classList.remove('hidden');
    confirm.classList.add('border-accent-red');
    valid = false;
  }
  return valid;
}

function setLoading(button, loading) {
  if (!button) return;
  const text = button.querySelector('.btn-text');
  const icon = button.querySelector('.btn-icon');
  const spinner = button.querySelector('.spinner');
  if (loading) {
    text.classList.add('hidden');
    if (icon) icon.classList.add('hidden');
    spinner.classList.remove('hidden');
    button.disabled = true;
  } else {
    text.classList.remove('hidden');
    if (icon) icon.classList.remove('hidden');
    spinner.classList.add('hidden');
    button.disabled = false;
  }
}

window.getChartThemeColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return {
    gridColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    tickColor: isDark ? '#9ca3af' : '#475569',
    titleColor: isDark ? '#f9fafb' : '#0f172a',
    primaryColor: isDark ? '#a5b4fc' : '#4f46e5',
    secondaryColor: '#f43f5e',
    cardColor: isDark ? '#0b0f19' : '#ffffff',
    tooltipBg: isDark ? '#111827' : '#ffffff',
    tooltipText: isDark ? '#f9fafb' : '#0f172a',
    palette: ['#4f46e5', '#f43f5e', '#0f766e', '#fbbf24', '#fb923c', '#2dd4bf', '#d97706']
  };
};

if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "'Fragment Mono', monospace";
  Chart.defaults.font.size = 10;
  Chart.defaults.color = '#475569';
}