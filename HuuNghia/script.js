// --- Âm thanh tương tác (Stardew Valley style) ---
const clickSound = new Audio("click.mp3");
clickSound.volume = 0.25; // âm lượng nhẹ
clickSound.preload = "auto";

// --- DOM elements ---
const items = document.querySelectorAll('.menu-item[data-panel]');
const panels = document.querySelectorAll('.subpanel');
const sunflower = document.getElementById('sunflower');
const toggleBtn = document.getElementById('darkToggle');

// --- mở/đóng bảng phụ ---
items.forEach(item => {
  item.addEventListener('click', () => {
    clickSound.currentTime = 0;
    clickSound.play();

    const key = item.dataset.panel;
    const target = document.querySelector(`.subpanel[data-key="${key}"]`);
    if (!target) return;

    const isVisible = target.classList.contains('visible');
    panels.forEach(p => {
      if (p !== target && p.classList.contains('visible')) {
        p.classList.remove('visible');
        p.classList.add('hide');
        setTimeout(() => p.classList.remove('hide'), 900);
      }
    });

    if (isVisible) {
      target.classList.remove('visible');
      target.classList.add('hide');
      setTimeout(() => target.classList.remove('hide'), 900);
      sunflower.classList.add('rotate');
      setTimeout(() => sunflower.classList.remove('rotate'), 1000);
      return;
    }

    target.classList.add('visible');
    sunflower.classList.add('rotate');
    setTimeout(() => sunflower.classList.remove('rotate'), 1000);
  });

  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.click();
    }
  });
});

// --- nút Quay lại ---
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    clickSound.currentTime = 0;
    clickSound.play();

    const panel = btn.closest('.subpanel');
    if (!panel) return;
    panel.classList.remove('visible');
    panel.classList.add('hide');
    setTimeout(() => panel.classList.remove('hide'), 900);
  });
});

// --- Dark mode ---
toggleBtn.addEventListener('click', () => {
  clickSound.currentTime = 0;
  clickSound.play();

  const active = document.body.classList.toggle('dark-mode');
  toggleBtn.classList.toggle('active', active);
  toggleBtn.setAttribute('aria-pressed', active);
});

// --- Hoa quay khi load ---
window.addEventListener('load', () => {
  sunflower.classList.add('rotate');
  setTimeout(() => sunflower.classList.remove('rotate'), 1000);
});

// --- Đóng panel bằng phím Escape ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    panels.forEach(p => {
      if (p.classList.contains('visible')) {
        p.classList.remove('visible');
        p.classList.add('hide');
        setTimeout(() => p.classList.remove('hide'), 900);
      }
    });
  }
});
