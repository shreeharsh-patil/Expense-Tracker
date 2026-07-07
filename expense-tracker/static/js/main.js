function onPageReady() {
  setThemeToggleIcon();

  // Flash message auto-dismissal
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

  // Reveal stat cards after a brief skeleton loading state
  revealStatSkeletons();

  // Chart initialization — show skeleton immediately, lazy-load Chart.js on scroll
  showChartSkeleton(true);
  if (typeof loadChartJsLazy === 'function') {
    loadChartJsLazy();
  }
}

document.addEventListener('DOMContentLoaded', onPageReady);

// Track menu state for aria-expanded
let mobileMenuOpen = false;

document.addEventListener('click', (e) => {
  // Theme toggle
  const themeToggle = e.target.closest('#theme-toggle');
  if (themeToggle) {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setThemeToggleIcon();
    window.dispatchEvent(new Event('theme-changed'));
    return;
  }

  // Mobile menu button
  const menuBtn = e.target.closest('#mobile-menu-btn');
  if (menuBtn) {
    const navLinks = document.getElementById('nav-links');
    const isOpening = navLinks.classList.contains('hidden');
    if (navLinks) {
      navLinks.classList.toggle('hidden');
      navLinks.classList.toggle('animate-fade-in-up');
      mobileMenuOpen = !isOpening;
      menuBtn.setAttribute('aria-expanded', String(mobileMenuOpen));
      if (mobileMenuOpen) {
        closeQuickSheet();
      }
    }
    return;
  }

  // Plus button in bottom nav opens quick-add sheet
  const plusBtn = e.target.closest('#nav-plus-btn');
  if (plusBtn) {
    openQuickSheet();
    return;
  }

  // Password toggle
  const toggleBtn = e.target.closest('.toggle-password');
  if (toggleBtn) {
    const targetId = toggleBtn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (input) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const toggleIcon = toggleBtn.querySelector('.toggle-password-icon');
      if (toggleIcon) {
        toggleIcon.innerHTML = `<svg class="w-[18px] h-[18px] text-current" viewBox="0 0 24 24" fill="none" stroke="none"><use href="#icon-${isPassword ? 'visibility-off' : 'visibility'}"/></svg>`;
      }
    }
    return;
  }

  // Flash message dismiss
  const dismissBtn = e.target.closest('[data-dismiss-flash]');
  if (dismissBtn) {
    const flash = dismissBtn.closest('.flash-message');
    if (flash) flash.remove();
    return;
  }

  // Quick-add overlay close
  if (e.target.closest('#quickAddOverlay')) {
    closeQuickSheet();
    return;
  }

  // Confirmation modal: cancel
  if (e.target.closest('#confirmModalCancel')) {
    closeConfirmModal(false);
    return;
  }

  // Confirmation modal: confirm
  if (e.target.closest('#confirmModalConfirm')) {
    closeConfirmModal(true);
    return;
  }

  // Click outside modal content to close
  if (e.target.closest('#confirmModal') && !e.target.closest('.modal-content')) {
    closeConfirmModal(false);
    return;
  }

  // Scroll-to-top
  if (e.target.closest('#scrollToTopBtn')) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // Deletion buttons that trigger the confirm modal
  const deleteFormBtn = e.target.closest('[data-confirm-delete]');
  if (deleteFormBtn) {
    e.preventDefault();
    const form = deleteFormBtn.closest('form');
    const message = deleteFormBtn.getAttribute('data-confirm-delete') || 'Are you sure you want to delete this item?';
    openConfirmModal(message, () => {
      if (form) form.submit();
    });
    return;
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Don't trigger shortcuts when typing in inputs
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  // Don't trigger shortcuts when modifier keys are held (prevents Ctrl+R/Cmd+R, etc.)
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key) {
    case 'n':
      e.preventDefault();
      const addLink = document.querySelector('[data-shortcut="new-expense"]') || 
                      document.querySelector('a[href*="add_expense"]');
      if (addLink) window.location.href = addLink.getAttribute('href');
      break;
    case 'i':
      e.preventDefault();
      const incomeLink = document.querySelector('a[href*="add_income"]');
      if (incomeLink) window.location.href = incomeLink.getAttribute('href');
      break;
    case 'r':
      e.preventDefault();
      const reportsLink = document.querySelector('[data-shortcut="reports"]') ||
                          document.querySelector('a[href*="reports"]');
      if (reportsLink) window.location.href = reportsLink.getAttribute('href');
      break;
    case 'd':
      e.preventDefault();
      const dashLink = document.querySelector('a[href*="dashboard.dashboard"]');
      if (dashLink) window.location.href = dashLink.getAttribute('href');
      break;
    case 'Escape':
      closeQuickSheet();
      if (mobileMenuOpen) {
        const navLinks = document.getElementById('nav-links');
        const menuBtn = document.getElementById('mobile-menu-btn');
        if (navLinks) {
          navLinks.classList.add('hidden');
          mobileMenuOpen = false;
          if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }
      }
      break;
  }
});

// Scroll-to-top visibility
window.addEventListener('scroll', () => {
  const btn = document.getElementById('scrollToTopBtn');
  if (!btn) return;
  if (window.scrollY > 400) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }
}, { passive: true });

// Theme toggle icon swap (SVG sprite)
function setThemeToggleIcon() {
  const container = document.getElementById('theme-toggle-icon');
  if (!container) return;
  const isDark = document.documentElement.classList.contains('dark');
  const iconName = isDark ? 'light_mode' : 'dark_mode';
  container.innerHTML = `<svg class="w-[18px] h-[18px] text-current" viewBox="0 0 24 24" fill="none" stroke="none"><use href="#icon-${iconName.replace(/_/g, '-')}"/></svg>`;
}

// Stat card skeleton reveal
function revealStatSkeletons() {
  const skeletons = document.querySelectorAll('.stat-skeleton');
  if (skeletons.length === 0) return;

  // Brief delay to allow the page entrance animation to start
  setTimeout(() => {
    skeletons.forEach((el, i) => {
      // Stagger the reveal slightly for visual smoothness
      setTimeout(() => {
        el.classList.add('loaded');
      }, i * 100);
    });
  }, 500);
}

// Chart skeleton helper
function showChartSkeleton(show) {
  document.querySelectorAll('.chart-skeleton').forEach(el => {
    if (show) el.classList.add('active');
    else el.classList.remove('active');
  });
}

// ============ Focus Trap Utility ============
let previousFocusedElement = null;

function getFocusableElements(container) {
  if (!container) return [];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];
  return Array.from(container.querySelectorAll(selectors.join(',')));
}

function trapFocus(container, event) {
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey) {
    // Shift+Tab: go backwards, wrap to last if leaving first
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else {
    // Tab: go forwards, wrap to first if leaving last
    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}

function enableFocusTrap(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  const handler = (e) => {
    if (e.key === 'Tab') {
      trapFocus(overlay, e);
    }
  };
  overlay._focusTrapHandler = handler;
  document.addEventListener('keydown', handler);
}

function disableFocusTrap(modalId) {
  const overlay = document.getElementById(modalId);
  if (overlay && overlay._focusTrapHandler) {
    document.removeEventListener('keydown', overlay._focusTrapHandler);
    delete overlay._focusTrapHandler;
  }
}

// ============ Confirmation Modal ============
let confirmCallback = null;

function openConfirmModal(message, callback) {
  const overlay = document.getElementById('confirmModal');
  const msgEl = document.getElementById('confirmModalMessage');
  if (overlay && msgEl) {
    // Store the currently focused element so we can restore it on close
    previousFocusedElement = document.activeElement;

    msgEl.textContent = message;
    confirmCallback = callback;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Enable focus trap
    enableFocusTrap('confirmModal');

    // Focus the cancel button for accessibility
    const cancelBtn = document.getElementById('confirmModalCancel');
    if (cancelBtn) setTimeout(() => cancelBtn.focus(), 100);
  }
}

function closeConfirmModal(confirmed) {
  const overlay = document.getElementById('confirmModal');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';

    // Disable focus trap
    disableFocusTrap('confirmModal');

    // Restore focus to the element that triggered the modal
    if (previousFocusedElement && previousFocusedElement.focus) {
      setTimeout(() => previousFocusedElement.focus(), 50);
      previousFocusedElement = null;
    }

    if (confirmed && confirmCallback) {
      confirmCallback();
    }
    confirmCallback = null;
  }
}

// ============ Mobile quick-add sheet ============
function openQuickSheet() {
  const sheet = document.getElementById('quickAddSheet');
  const overlay = document.getElementById('quickAddOverlay');
  if (sheet && overlay) {
    sheet.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeQuickSheet() {
  const sheet = document.getElementById('quickAddSheet');
  const overlay = document.getElementById('quickAddOverlay');
  if (sheet && overlay) {
    sheet.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ============ OTP Digit Auto-Advance ============
document.addEventListener('input', (e) => {
  const digit = e.target.closest('.otp-digit');
  if (!digit) return;
  const value = digit.value.replace(/[^0-9]/g, '');
  digit.value = value;
  if (value && value.length === 1) {
    digit.classList.add('filled');
    const next = digit.parentElement.querySelector(`[data-index="${parseInt(digit.dataset.index) + 1}"]`);
    if (next) next.focus();
  }
  // Update hidden field with combined value
  const hidden = document.getElementById('otp-code-hidden');
  if (hidden) {
    const allDigits = document.querySelectorAll('.otp-digit');
    hidden.value = Array.from(allDigits).map(d => d.value).join('');
  }
});

document.addEventListener('keydown', (e) => {
  const digit = e.target.closest('.otp-digit');
  if (!digit) return;
  if (e.key === 'Backspace' && !digit.value) {
    const prev = digit.parentElement.querySelector(`[data-index="${parseInt(digit.dataset.index) - 1}"]`);
    if (prev) {
      prev.value = '';
      prev.classList.remove('filled');
      prev.focus();
    }
  }
  if (e.key === 'ArrowLeft') {
    const prev = digit.parentElement.querySelector(`[data-index="${parseInt(digit.dataset.index) - 1}"]`);
    if (prev) prev.focus();
  }
  if (e.key === 'ArrowRight') {
    const next = digit.parentElement.querySelector(`[data-index="${parseInt(digit.dataset.index) + 1}"]`);
    if (next) next.focus();
  }
});

// Paste support for OTP
document.addEventListener('paste', (e) => {
  const digit = e.target.closest('.otp-digit');
  if (!digit) return;
  e.preventDefault();
  const paste = (e.clipboardData || window.clipboardData).getData('text');
  const digits = paste.replace(/[^0-9]/g, '').split('').slice(0, 6);
  const allDigits = document.querySelectorAll('.otp-digit');
  digits.forEach((d, i) => {
    if (allDigits[i]) {
      allDigits[i].value = d;
      allDigits[i].classList.add('filled');
    }
  });
  // Focus next empty or last
  const nextEmpty = Array.from(allDigits).find(d => !d.value);
  if (nextEmpty) nextEmpty.focus();
  else if (allDigits.length > 0) allDigits[allDigits.length - 1].focus();
  // Update hidden field
  const hidden = document.getElementById('otp-code-hidden');
  if (hidden) {
    hidden.value = digits.join('');
  }
});

// ============ Form Validation ============
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

  // OTP verification form — validate all 6 digits filled
  const otpForm = e.target.closest('#otp-form');
  if (otpForm) {
    const allDigits = document.querySelectorAll('.otp-digit');
    const code = Array.from(allDigits).map(d => d.value).join('');
    const errorEl = document.getElementById('otp-error');
    if (code.length !== 6) {
      e.preventDefault();
      if (errorEl) errorEl.classList.remove('hidden');
      allDigits.forEach(d => {
        if (!d.value) {
          d.classList.add('border-accent-red');
          d.focus();
        }
      });
      return;
    }
    if (errorEl) errorEl.classList.add('hidden');
    setLoading(otpForm.querySelector('#otp-submit'), true);
    return; // allow normal form submission
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
    if (text) text.classList.add('hidden');
    if (icon) icon.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
    button.disabled = true;
  } else {
    if (text) text.classList.remove('hidden');
    if (icon) icon.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
    button.disabled = false;
  }
}

// ============ Chart Theme ============
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

