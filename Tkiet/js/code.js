/* ================== tiny utils ================== */
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* ================== z-index manager ================== */
let z = 20;
const bringToFront = (el) => (el.style.zIndex = ++z);

/* ================== position store (lưu kèm viewport) ================== */
const POS_KEY = 'site:popupPos';
const Pos = {
  _cache: null,
  _read() {
    if (this._cache) return this._cache;
    try { this._cache = JSON.parse(localStorage.getItem(POS_KEY) || '{}'); }
    catch { this._cache = {}; }
    return this._cache;
  },
  get(id) {
    return this._read()?.[id] || null; // { left, top, vw, vh }
  },
  set(id, left, top) {
    const db = this._read();
    db[id] = { left, top, vw: window.innerWidth, vh: window.innerHeight };
    localStorage.setItem(POS_KEY, JSON.stringify(db));
  },
  del(id) {
    const db = this._read();
    delete db[id];
    localStorage.setItem(POS_KEY, JSON.stringify(db));
  }
};

/* ================== viewport helpers ================== */
function clampToViewport(left, top, w, h) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const L = Math.min(Math.max(0, left), Math.max(0, vw - w));
  const T = Math.min(Math.max(0, top),  Math.max(0, vh - h));
  return { left: L, top: T };
}

/* Scale vị trí theo thay đổi viewport (fullscreen / resize mạnh) */
function scaledPosition(saved, popW, popH) {
  if (!saved) return null;
  const { left, top, vw, vh } = saved;
  const curVW = window.innerWidth, curVH = window.innerHeight;

  if (!vw || !vh || vw <= 0 || vh <= 0) {
    return clampToViewport(left, top, popW, popH);
  }
  const sx = curVW / vw;
  const sy = curVH / vh;
  const L = left * sx;
  const T = top  * sy;
  return clampToViewport(L, T, popW, popH);
}

/* ================== popup open / close ================== */
function openPopup(id) {
  const pop = document.getElementById(id);
  if (!pop) return;

  const saved = Pos.get(id);
  if (saved) {
    const w = pop.offsetWidth || 420;
    const h = pop.offsetHeight || 300;
    const pos = scaledPosition(saved, w, h);
    pop.style.left = pos.left + 'px';
    pop.style.top  = pos.top  + 'px';
    pop.classList.add('placed');
  } else {
    // Không có -> để nguyên CSS center (left/top 50% + transform)
    pop.classList.remove('placed');
  }

  bringToFront(pop);
  pop.classList.remove('hidden');
  requestAnimationFrame(() => pop.classList.add('open'));
}

function closePopup(pop) {
  pop = typeof pop === 'string' ? document.getElementById(pop) : pop;
  if (!pop) return;

  pop.classList.remove('open');
  pop.classList.add('closing'); // 🔥 thêm class đóng để có anim

  const onEnd = (e) => {
    if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
      pop.classList.remove('closing');
      pop.classList.add('hidden');
      pop.removeEventListener('transitionend', onEnd);
    }
  };
  pop.addEventListener('transitionend', onEnd, { once: true });
}


/* ================== drag via Pointer Events ================== */
function enableDrag(win) {
  const handle = win.querySelector('.popup-header');
  if (!handle) return;

  let pressed = false;      // đã nhấn nhưng chưa đủ ngưỡng kéo
  let dragging = false;     // đã vượt ngưỡng -> đang kéo
  let sx=0, sy=0, sl=0, st=0;
  const START_THRESHOLD = 4; // px

  const disableAnim = (el) => {
    // tắt transition ngay lập tức để không “giật”
    el.classList.add('no-anim');
    el.style.willChange = 'left, top';
  };
  const restoreAnim = (el) => {
    el.classList.remove('no-anim');
    el.style.willChange = '';
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('[data-close],button,a,input,textarea,select,label')) return;

    pressed = true;
    dragging = false;

    // Tắt anim TRƯỚC khi đổi transform -> left/top để không giật
    disableAnim(win);

    // Nếu đang center bằng transform, chuyển sang chế độ placed ở đúng tọa độ hiện tại
    if (!win.classList.contains('placed')) {
      const r0 = win.getBoundingClientRect();
      win.style.left = r0.left + 'px';
      win.style.top  = r0.top  + 'px';
      win.classList.add('placed');
      // ép reflow để transition không nhảy
      void win.getBoundingClientRect();
    }

    sx = e.clientX; sy = e.clientY;
    const r = win.getBoundingClientRect();
    sl = r.left; st = r.top;

    try { handle.setPointerCapture(e.pointerId); } catch {}
    bringToFront(win);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!pressed) return;
    try { if (!handle.hasPointerCapture?.(e.pointerId)) return; } catch {}

    const dx = e.clientX - sx;
    const dy = e.clientY - sy;

    // chưa đủ ngưỡng -> không di chuyển để tránh “hiccup”
    if (!dragging) {
      if (Math.hypot(dx, dy) < START_THRESHOLD) return;
      dragging = true;
      win.classList.add('dragging');
    }

    const w = win.offsetWidth, h = win.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.min(Math.max(0, sl + dx), Math.max(0, vw - w));
    const top  = Math.min(Math.max(0, st + dy), Math.max(0, vh - h));

    win.style.left = left + 'px';
    win.style.top  = top  + 'px';
  };

  const onPointerUp = (e) => {
    // trả trạng thái
    try { if (handle.hasPointerCapture?.(e.pointerId)) handle.releasePointerCapture(e.pointerId); } catch {}
    if (pressed) {
      if (dragging) {
        // lưu vị trí cuối (nếu bạn đang dùng Pos.set thì giữ nguyên dòng dưới)
        const r = win.getBoundingClientRect();
        if (typeof Pos?.set === 'function' && win.id) Pos.set(win.id, r.left, r.top);
        win.classList.remove('dragging');
      }
      pressed = false;
      dragging = false;
      // Bật lại anim sau khi kết thúc kéo
      restoreAnim(win);
    }
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);

  // nếu thả chuột ra ngoài header (edge cases)
  window.addEventListener('pointerup', onPointerUp);

  // click vào cửa sổ -> lên trên
  win.addEventListener('mousedown', () => bringToFront(win));
}
/* ================== Howler unlock (Safari/iOS) ================== */
window.addEventListener('pointerdown', () => {
  try { Howler.ctx?.resume?.(); } catch {}
}, { once: true });

/* ================== sounds ================== */
const sounds = (() => {
  try {
    return {
      click:    new Howl({ src: ['./sounds/click.mp3'],       volume: 0.5 }),
      hover:    new Howl({ src: ['./sounds/hover.mp3'],       volume: 0.35 }),
      open:     new Howl({ src: ['./sounds/popup_open.mp3'],  volume: 0.5 }),
      close:    new Howl({ src: ['./sounds/popup_close.mp3'], volume: 0.5 }),
      darkMode: new Howl({ src: ['./sounds/dark_mode.mp3'],   volume: 0.6 }),
      lightMode:new Howl({ src: ['./sounds/light_mode.mp3'],  volume: 0.6 }),
      easter:   new Howl({ src: ['./sounds/desktop_easter.mp3'], volume: 0.7, loop: true })
    };
  } catch {
    return new Proxy({}, { get: () => ({ play(){}, stop(){} }) });
  }
})();

/* ================== theme & sound icon ================== */
const SOUND_KEY = 'site:sound';
const isDark = () => document.body.classList.contains('dark');

function applyThemeIcons() {
  const dark = isDark();
  $$('.theme-icon').forEach(img => {
    if (img?.dataset?.light && img?.dataset?.dark) {
      img.src = dark ? img.dataset.dark : img.dataset.light;
    }
  });
}

function updateSoundIcon() {
  const btnSound = $('#btnSound');
  const img = btnSound?.querySelector('img');
  if (!img) return;
  const muted = (typeof Howler !== 'undefined') ? (Howler._muted === true) : true;
  const src = muted
    ? (isDark() ? img.dataset.offDark : img.dataset.offLight)
    : (isDark() ? img.dataset.onDark  : img.dataset.onLight);
  if (src) img.src = src;
  img.alt = muted ? 'Muted' : 'Sound on';
}

function setSoundFromStorage() {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    if (typeof Howler !== 'undefined') Howler.mute(v === 'off');
  } catch {}
  updateSoundIcon();
}

/* ================== Easter player (star button) ================== */
const EasterPlayer = window.EasterPlayer ?? {
  sound: (() => {
    try { return new Howl({ src: ['./sounds/rework.mp3'], volume: 0.7, loop: true, preload: true }); }
    catch { return { play(){}, stop(){} }; }
  })(),
  playing: false,
  frog: null,
  initOnce() {
    if (this.frog) return;
    this.frog = document.querySelector('.frog');
    // bảo vệ: nếu lỡ thiếu data-still/data-dance thì fall back theo src hiện có
    if (this.frog) {
      if (!this.frog.dataset.still) this.frog.dataset.still = this.frog.getAttribute('src') || '';
    }
  },
  setImage(isPlaying) {
    if (!this.frog) return;
    const nextSrc = isPlaying ? this.frog.dataset.dance : this.frog.dataset.still;
    if (nextSrc) this.frog.src = nextSrc;
    this.frog.classList.toggle('is-dancing', !!isPlaying);
  },
  toggle() {
    this.initOnce();

    if (this.playing) {
      // stop
      this.sound.stop?.();
      this.playing = false;
      this.setImage(false);
      updateStarUI(false);
    } else {
      // muted thì không bật
      if (typeof Howler !== 'undefined' && Howler._muted) return;
      this.sound.play?.();
      this.playing = true;
      this.setImage(true);
      updateStarUI(true);
    }
  }
};
window.EasterPlayer = EasterPlayer;

function updateStarUI(playing) {
  const starBtn = document.getElementById('easterBtn');
  const starTag = document.getElementById('easterTag');

  if (starBtn) {
    starBtn.classList.toggle('playing', playing);
  }
  if (starTag) {
    starTag.textContent = playing ? 'tạm dừng thư giãn~' : 'Ấn vào mình đi';
  }
}

/* ===== Nếu muốn reset vị trí mỗi lần reload thì để true ===== */
const RESET_ON_RELOAD = true; // đổi false nếu bạn muốn giữ bố cục qua lần F5 sau
if (RESET_ON_RELOAD) {
  try { localStorage.removeItem(POS_KEY); } catch {}
}

/* ================== Frog Chat ================== */
const FrogChat = (() => {
  // Danh sách câu & file âm thanh tương ứng (bạn đổi text + file tùy ý)
  const TALK = './sounds/Dialogs/talking.mp3';

  const LINES = [
    { t: 'Nhìn thấy cái ngôi sao kia không? bấm vào thử đi vui lắm 😆', s: TALK },
    { t: 'Code một lúc là nghỉ mắt nha, 20-20-20 đó!',        s: TALK },
    { t: 'Gì đó? Tui cũng muốn nhảy mà',  s: TALK },
    { t: 'Thêm 1% tiến bộ mỗi ngày là đỉnh!',              s: TALK },
    { t: 'Mua Fumo đi mua đi mà',              s: TALK },
    { t: 'Giữ gìn sức khoẻ nha',              s: TALK },
    { t: 'Wo ai ni🎶',              s: TALK },
    { t: 'Hello world', s: TALK },
    { t: 'Trời sáng nhỉ ? Những không sáng bằng ý chí của bạn đâu hehe', s: TALK },
    { t: 'Vừa bóc trúng easter egg hả? Tuyệt ghê nhaaa', s: TALK },
    { t: 'Dev không lười đâu nha chỉ là hơi mệt thuiii', s: TALK },
    { t: 'Hãy trân trọng chính mình nhé bạn chỉ có 1 thôi đó duy nhất luôn', s: TALK },
    { t: 'Hãy cứ cố gắng nha dù chỉ là 1 chút ít nhưng đó là nỗ lực đáng kính của bạn mà', s: TALK },
  ];

  let bubble, textEl, closeBtn;
  let lastIdx = -1;
  let hideTimer = null;
  let cooldown = false;
  let player = null; // Howl của câu hiện tại

  function pickLine() {
    if (!LINES.length) return { t: 'Ribbit!', s: null };
    let i;
    do { i = Math.floor(Math.random() * LINES.length); }
    while (LINES.length > 1 && i === lastIdx);
    lastIdx = i;
    return LINES[i];
  }

  function ensureBubble() {
    if (bubble) return;
    bubble = document.createElement('div');
    bubble.className = 'frog-chat';
    bubble.innerHTML = '<button class="x" aria-label="close">×</button><p class="tx"></p>';
    document.body.appendChild(bubble);
    textEl = bubble.querySelector('.tx');
    closeBtn = bubble.querySelector('.x');
    closeBtn.addEventListener('click', hide);
  }

  function show(msg) {
    ensureBubble();
    textEl.textContent = msg;
    bubble.classList.add('show');
    bringToFront(bubble);
  }

  function hide() {
    if (!bubble) return;
    bubble.classList.remove('show');
  }

function playSound(file) {
  if (!file) return;
  try {
    player?.stop();
    if (typeof Howler !== 'undefined' && !Howler._muted) {
      // random pitch (từ 0.9x đến 1.2x, đủ khác tông nhưng không biến dạng)
      const randRate = 0.9 + Math.random() * 0.3;

      player = new Howl({
        src: [file],
        volume: 0.8,
        rate: randRate, // 🔊 chỉnh tốc độ => đổi pitch
      });

      player.play();
    }
  } catch (err) {
    console.warn('FrogChat sound error:', err);
  }
}

  function trigger() {
    if (cooldown) return;
    cooldown = true;
    setTimeout(() => (cooldown = false), 600); // chống spam

    const { t, s } = pickLine();
    show(t);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 3600); // auto ẩn sau ~3.6s
    sounds.click.play?.(); // tiếng click chung của site
    playSound(s);
  }

  return {
    init() {
      const frog = document.querySelector('.frog');
      if (!frog) return;
      ensureBubble();
      frog.addEventListener('click', trigger);
    },
    say(text, soundFile = null) { // API nếu sau này bạn muốn gọi thủ công
      show(text); playSound(soundFile);
      clearTimeout(hideTimer); hideTimer = setTimeout(hide, 3600);
    }
  };
})();


/* ================== Init ================== */
document.addEventListener('DOMContentLoaded', () => {
  /* init position + drag for every popup */

  FrogChat.init();
  $$('.popup').forEach((pop) => {
    const saved = Pos.get(pop.id);
    if (saved) {
      pop.style.left = saved.left + 'px';
      pop.style.top  = saved.top  + 'px';
      pop.classList.add('placed');
    }
    enableDrag(pop);
  });

  /* ===== Debounce cho thay đổi viewport (resize/fullscreen) ===== */
  let _vpTimer = null;
  function handleViewportChange() {
    $$('.popup.placed').forEach((pop) => {
      const saved = Pos.get(pop.id);
      const r = pop.getBoundingClientRect();
      const w = r.width  || pop.offsetWidth  || 420;
      const h = r.height || pop.offsetHeight || 300;

      const pos = scaledPosition(
        saved || { left: r.left, top: r.top, vw: window.innerWidth, vh: window.innerHeight },
        w, h
      );
      pop.style.left = pos.left + 'px';
      pop.style.top  = pos.top  + 'px';
      if (pop.id) Pos.set(pop.id, pos.left, pos.top);
    });
  }
  function scheduleViewportFix() {
    if (_vpTimer) cancelAnimationFrame(_vpTimer);
    _vpTimer = requestAnimationFrame(handleViewportChange);
  }

  /* Thay vì clamp đơn thuần, dùng scale + clamp để không “bay” khi fullscreen */
  window.addEventListener('resize', scheduleViewportFix);
  document.addEventListener('fullscreenchange', scheduleViewportFix);
  document.addEventListener('webkitfullscreenchange', scheduleViewportFix);

  /* device warning */
  const warn = $('#device-warning');
  const btnCloseWarn = $('#close-warning');
  if (innerWidth < 1025 && warn) setTimeout(() => warn.classList.remove('hidden'), 800);
  btnCloseWarn?.addEventListener('click', () => warn.classList.add('hidden'));

  /* theme init */
  const btnTheme = $('#btnTheme');
  const themeIcon = $('#themeIcon');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');
  applyThemeIcons();
  if (themeIcon) {
    themeIcon.src = isDark() ? './img/dark_mode_dark.webp' : './img/dark_mode_light.webp';
  }
  btnTheme?.addEventListener('click', () => {
    const willBeDark = !isDark();
    (willBeDark ? sounds.darkMode : sounds.lightMode).play();
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark() ? 'dark' : 'light');
    applyThemeIcons();
    if (themeIcon) themeIcon.src = isDark() ? './img/dark_mode_dark.webp' : './img/dark_mode_light.webp';
    updateSoundIcon();
  });

  /* sound init */
  setSoundFromStorage();
  $('#btnSound')?.addEventListener('click', () => {
    const nextMuted = (typeof Howler !== 'undefined') ? !Howler._muted : true;
    if (typeof Howler !== 'undefined') Howler.mute(nextMuted);
    try { localStorage.setItem(SOUND_KEY, nextMuted ? 'off' : 'on'); } catch {}
    updateSoundIcon();
    if (!nextMuted) sounds.click.play();
  });

  /* hover sound (throttle) */
  let lastHoverTime = 0;
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('button, a, .icon-menu a, .download_button');
    if (!t) return;
    const now = performance.now();
    if (now - lastHoverTime > 90) {
      lastHoverTime = now;
      sounds.hover.play?.();
    }
  }, { passive: true });

  /* click delegation */
  document.addEventListener('click', (e) => {
    const opener = e.target.closest?.('[data-open]');
      if (opener) {
      e.preventDefault();
      sounds.click.play?.();   // 🔊 phát âm thanh click
      openPopup(opener.dataset.open);
      sounds.open.play?.();
      return;
    }
    if (e.target.matches?.('[data-close]')) {
      e.preventDefault();
      const pop = e.target.closest('.popup');
      if (pop) {
        closePopup(pop);
        sounds.close.play?.();
      }
      return;
    }
    const clickable = e.target.closest?.('button, a, .icon-menu a, .download_button');
    if (clickable) sounds.click.play?.();
  });

  /* chặn nổi bọt khi bấm nút [x] để không kích hoạt drag */
  document.addEventListener('mousedown', (e) => {
    if (e.target.matches?.('[data-close]')) e.stopPropagation();
  });


  /* Easter star */
  $('#easterBtn')?.addEventListener('click', (e) => { e.preventDefault(); EasterPlayer.toggle(); });
  $('#easterTag')?.addEventListener('click', (e) => { e.preventDefault(); EasterPlayer.toggle(); });
});

// === Lightbox xem ảnh full ===
const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.className = 'lightbox hidden';
lightbox.innerHTML = '<img src="" alt="full view">';
document.body.appendChild(lightbox);

const lightboxImg = lightbox.querySelector('img');

// mở lightbox khi click ảnh
document.querySelectorAll('.work-card img').forEach(img => {
  img.addEventListener('click', e => {
    // tiếng bấm ảnh
    sounds.click.play?.();

    // bật lightbox
    lightboxImg.src = img.src;
    lightbox.classList.remove('hidden');

    // tiếng mở (zoom in)
    sounds.open.play?.();
  });
});

// click vùng tối để đóng
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) {
    // tiếng đóng (zoom out)
    sounds.close.play?.();

    lightbox.classList.add('hidden');
  }
});
/* ================== expose helpers (optional) ================== */
window.openPopup  = openPopup;
window.closePopup = closePopup;

/* FAQ: chỉ mở 1 item tại 1 thời điểm + thêm tiếng click */
document.addEventListener('click', (e) => {
  const item = e.target.closest('.faq-item');
  if (!item) return;

  // khi người dùng bấm summary
  if (e.target.tagName === 'SUMMARY' || e.target.closest('summary')) {
    sounds.click.play?.(); // 🔊 phát tiếng click

    // chỉ cho phép mở 1 item
    document.querySelectorAll('.faq-item[open]').forEach((openItem) => {
      if (openItem !== item) openItem.removeAttribute('open');
    });
  }
}, true);

