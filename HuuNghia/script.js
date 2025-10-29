// --- Âm thanh tương tác (Stardew Valley style) ---
const clickSound = new Audio("click.mp3");
clickSound.volume = 0.25;
clickSound.preload = "auto";
// --- Intro Screen Activation ---
window.addEventListener("load", () => {
  const intro = document.querySelector(".intro-screen");
  const enterBtn = document.getElementById("enter-btn");
  const mainMenu = document.querySelector(".menu");
  const header = document.querySelector(".main-header");

  if (intro && enterBtn) {
    intro.classList.add("active");

    enterBtn.addEventListener("click", () => {
      intro.classList.add("fade-out");
      setTimeout(() => {
        intro.remove();
        if (mainMenu) mainMenu.style.opacity = "1";
        if (header) header.style.opacity = "1";
      }, 1000);
    });
  } else {
    // Nếu không có intro-screen, vẫn đảm bảo hiển thị menu và header
    if (mainMenu) mainMenu.style.opacity = "1";
    if (header) header.style.opacity = "1";
  }
});

// --- DOM elements ---
const items = document.querySelectorAll('.menu-item[data-panel]');
const panels = document.querySelectorAll('.subpanel');
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
      return;
    }

    target.classList.add('visible');
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
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
  toggleBtn.classList.add("active");
}

toggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clickSound.currentTime = 0;
  clickSound.play();

  const active = document.body.classList.toggle('dark-mode');
  toggleBtn.classList.toggle('active', active);
  toggleBtn.setAttribute('aria-pressed', active);
  localStorage.setItem("darkMode", active);
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

// --- Auto rotate card stacks ---
document.querySelectorAll(".card-stack").forEach(stack => {
  const cards = Array.from(stack.querySelectorAll(".card"));
  let current = 0;
  let interval;

  // Đảm bảo chỉ 1 ảnh hiển thị ban đầu
  cards.forEach((c, i) => c.style.opacity = i === 0 ? 1 : 0);

  function showNext() {
    const prev = current;
    current = (current + 1) % cards.length;

    // Ẩn ảnh cũ
    cards[prev].style.opacity = 0;
    cards[prev].style.zIndex = 0;

    // Hiện ảnh mới
    cards[current].style.opacity = 1;
    cards[current].style.zIndex = 1;
  }

  function startRotation() {
    interval = setInterval(showNext, 4000);
  }

  function stopRotation() {
    clearInterval(interval);
  }

  startRotation();
  stack.addEventListener("mouseenter", stopRotation);
  stack.addEventListener("mouseleave", startRotation);
});


// --- Idle video system ---
const idleVideo = document.getElementById("idle-video");
let idleTimeout;

function resetIdleTimer() {
  clearTimeout(idleTimeout);
  idleVideo.classList.remove("active");
  idleTimeout = setTimeout(() => {
    const hasPanelOpen = document.querySelector(".subpanel.visible");
    if (!hasPanelOpen) {
      idleVideo.classList.add("active");
    }
  }, 3000);
}

// --- Music Background System ---
const musicToggle = document.getElementById("musicToggle");
let backgroundMusic = new Audio("nhacnen.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.35;
let isMusicPlaying = true;
let fadeInterval;

window.addEventListener("load", () => {
  try {
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(() => {
      document.body.addEventListener("click", startMusicAfterBlock, { once: true });
    });
  } catch (err) {
    console.warn("Autoplay bị chặn, chờ tương tác người dùng.");
  }
});

function startMusicAfterBlock() {
  backgroundMusic.play().catch(() => {});
  document.body.removeEventListener("click", startMusicAfterBlock);
}

function fadeVolume(target, duration) {
  clearInterval(fadeInterval);
  const step = 0.05;
  const interval = duration / (1 / step);

  if (target > backgroundMusic.volume) {
    fadeInterval = setInterval(() => {
      if (backgroundMusic.volume < target) {
        backgroundMusic.volume = Math.min(backgroundMusic.volume + step, target);
      } else clearInterval(fadeInterval);
    }, interval);
  } else {
    fadeInterval = setInterval(() => {
      if (backgroundMusic.volume > target) {
        backgroundMusic.volume = Math.max(backgroundMusic.volume - step, target);
      } else clearInterval(fadeInterval);
    }, interval);
  }
}

musicToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  clickSound.currentTime = 0;
  clickSound.play();

  if (isMusicPlaying) {
    fadeVolume(0, 1000);
    setTimeout(() => backgroundMusic.pause(), 1000);
  } else {
    backgroundMusic.play().catch(() => {});
    fadeVolume(0.35, 1000);
  }

  isMusicPlaying = !isMusicPlaying;
  musicToggle.classList.toggle("active", !isMusicPlaying);
  musicToggle.setAttribute("aria-pressed", !isMusicPlaying);
});

["mousedown", "click", "keydown", "touchstart"].forEach(evt => {
  document.addEventListener(evt, e => {
    if (e.target.closest("#darkToggle")) return;
    resetIdleTimer();
  });
});

resetIdleTimer();

// --- Bảo đảm subpanel khởi tạo đúng ---
document.addEventListener("DOMContentLoaded", () => {
  const firstPanel = document.querySelector(".subpanel[data-key]");
  if (firstPanel) {
    firstPanel.classList.add("visible");
  }
});


// --- Hiệu ứng hiện dần từng khối khi cuộn ---
document.addEventListener("scroll", () => {
  document.querySelectorAll(".content-block").forEach(block => {
    const rect = block.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      block.classList.add("visible");
    }
  });
});
window.addEventListener("load", () => {
  const firstPanel = document.querySelector(".subpanel[data-key='single']");
  if (firstPanel) firstPanel.classList.add("visible");
});
// 🌻 Hiệu ứng bông hoa xoay mượt khi click
const sunflower = document.getElementById("sunflower");
if (sunflower) {
  sunflower.addEventListener("click", () => {
    sunflower.classList.remove("spin");
    void sunflower.offsetWidth; // reset animation
    sunflower.classList.add("spin");
  });
}


// ✨ Hiệu ứng đom đóm dưới footer
document.addEventListener("DOMContentLoaded", () => {
  const fireflyArea = document.querySelector(".firefly-area");
  if (!fireflyArea) return;

  const fireflyCount = 12;
  for (let i = 0; i < fireflyCount; i++) {
    const f = document.createElement("div");
    f.classList.add("firefly");

    const startX = Math.random() * 100;
    const endX = Math.random() * 100;
    const startY = Math.random() * 100;
    const endY = Math.random() * 100;

    f.style.setProperty("--x-start", `${startX}vw`);
    f.style.setProperty("--y-start", `${startY / 5}vh`);
    f.style.setProperty("--x-end", `${endX}vw`);
    f.style.setProperty("--y-end", `${endY / 5}vh`);

    const colors = ["#f5e77d", "#b2f5a3", "#ffffffcc"];
    f.style.background = `radial-gradient(circle, ${
      colors[Math.floor(Math.random() * colors.length)]
    } 0%, transparent 70%)`;

    f.style.animationDuration = `${10 + Math.random() * 10}s, ${
      1.5 + Math.random()
    }s`;

    fireflyArea.appendChild(f);
  }
});
// 🌻 Hiệu ứng bông hoa quay mỗi khi click
window.addEventListener("load", () => {
  const sunflower = document.getElementById("sunflower");
  if (!sunflower) {
    console.warn("Không tìm thấy bông hoa 🌻");
    return;
  }

  sunflower.addEventListener("click", () => {
    sunflower.classList.remove("spinSun");
    void sunflower.offsetWidth; // ép reset animation
    sunflower.classList.add("spinSun");
  });

  console.log("🌻 Hiệu ứng bông hoa đã được kích hoạt!");
});

// === Lightbox ảnh (zoom ảnh khi click) ===
document.addEventListener("DOMContentLoaded", () => {
  const viewer = document.createElement("div");
  viewer.className = "image-viewer";
  const img = document.createElement("img");
  viewer.appendChild(img);
  document.body.appendChild(viewer);

  // Khi click vào ảnh
  document.querySelectorAll(".block-image img").forEach(image => {
    image.addEventListener("click", () => {
      img.src = image.src;
      viewer.classList.add("active");
    });
  });

  // Khi click vào vùng nền hoặc ảnh thì đóng
  viewer.addEventListener("click", () => {
    viewer.classList.remove("active");
  });

  // Thoát bằng phím ESC
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") viewer.classList.remove("active");
  });
});
// === LIGHTBOX GALLERY cho card-stack ===
document.addEventListener("DOMContentLoaded", () => {
  const viewer = document.createElement("div");
  viewer.className = "image-viewer";
  viewer.innerHTML = `
    <button class="viewer-btn left" aria-label="Ảnh trước">⟵</button>
    <img src="" alt="">
    <button class="viewer-btn right" aria-label="Ảnh kế">⟶</button>
    <div class="viewer-caption"></div>
  `;
  document.body.appendChild(viewer);

  const imgEl = viewer.querySelector("img");
  const caption = viewer.querySelector(".viewer-caption");
  const btnLeft = viewer.querySelector(".viewer-btn.left");
  const btnRight = viewer.querySelector(".viewer-btn.right");

  let currentIndex = 0;
  let images = [];
  let activeInterval = null;

  // Khi click vào 1 card-stack
  document.querySelectorAll(".card-stack").forEach(stack => {
    stack.addEventListener("click", (e) => {
      e.stopPropagation();
      const cards = Array.from(stack.querySelectorAll(".card"));
      if (!cards.length) return;

      // dừng auto-rotate
      if (stack.dataset.intervalId) {
        clearInterval(stack.dataset.intervalId);
        stack.dataset.intervalId = "";
      }

      images = cards.map(c => ({ src: c.src, alt: c.alt }));
      const activeIndex = cards.findIndex(c => c.classList.contains("active"));
      currentIndex = activeIndex >= 0 ? activeIndex : 0;

      showImage(currentIndex);
      viewer.classList.add("active");
    });
  });

  // Hiển thị ảnh
  function showImage(index) {
    const item = images[index];
    imgEl.src = item.src;
    imgEl.alt = item.alt;
    caption.textContent = item.alt || "";
  }

  // Chuyển trái/phải
  btnLeft.addEventListener("click", e => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
  });
  btnRight.addEventListener("click", e => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
  });

  // Click ra ngoài hoặc ảnh thì đóng
  viewer.addEventListener("click", () => {
    viewer.classList.remove("active");
  });

  // Phím tắt
  document.addEventListener("keydown", e => {
    if (!viewer.classList.contains("active")) return;
    if (e.key === "Escape") viewer.classList.remove("active");
    if (e.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    }
    if (e.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(currentIndex);
    }
  });
});
