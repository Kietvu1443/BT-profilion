/* ========= helpers ========= */
const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

/* ========= z-index manager ========= */
let z = 20;
const bringToFront = (el) => (el.style.zIndex = ++z);

/* ========= core actions (animation-friendly) ========= */
function centerPopup(pop){
  // chỉ căn giữa; scale/opacity để CSS lo
  pop.style.left = '50%';
  pop.style.top  = '50%';
}

function openPopup(id){
  const pop = document.getElementById(id);
  if(!pop) return;

  centerPopup(pop);
  bringToFront(pop);

  // hiện để transition có thể chạy
  pop.classList.remove('hidden');

  // chuyển sang frame kế để thêm .open => tránh giật
  requestAnimationFrame(() => {
    pop.classList.add('open'); // CSS sẽ scale từ nhỏ -> 1 và fade-in
  });
}

function closePopup(pop){
  pop = (typeof pop === 'string') ? document.getElementById(pop) : pop;
  if(!pop) return;

  // chạy animation đóng
  pop.classList.remove('open');

  // khi transition xong mới ẩn hẳn
  const onEnd = (e)=>{
    if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
      pop.classList.add('hidden');
      pop.removeEventListener('transitionend', onEnd);
    }
  };
  pop.addEventListener('transitionend', onEnd, { once:true });
}

/* ========= drag by header (có threshold, không giật) ========= */
function enableDrag(win){
  const handle = $('.popup-header', win);
  if(!handle) return;

  let maybeDrag=false, dragging=false, sx=0, sy=0, sl=0, st=0;
  const START_THRESHOLD = 4; // px

  handle.addEventListener('mousedown', (e)=>{
    // chỉ chuột trái + không phải nút đóng/element tương tác
    if (e.button !== 0) return;
    if (e.target.closest('[data-close]')) return;
    const tag = e.target.tagName.toLowerCase();
    if (['button','a','input','textarea','select','label'].includes(tag)) return;

    maybeDrag = true; dragging = false;
    sx = e.clientX; sy = e.clientY;
    e.preventDefault(); // tránh select text
  });

  window.addEventListener('mousemove', (e)=>{
    if (!maybeDrag && !dragging) return;

    const dx = e.clientX - sx;
    const dy = e.clientY - sy;

    // chưa vượt ngưỡng -> chưa bắt đầu kéo
    if (maybeDrag && Math.hypot(dx, dy) < START_THRESHOLD) return;

    // bắt đầu kéo thật sự
    if (maybeDrag && !dragging) {
      maybeDrag = false;
      dragging  = true;

      // chuyển sang toạ độ tuyệt đối NGAY LÚC BẮT ĐẦU KÉO (không sớm hơn)
      const r = win.getBoundingClientRect();
      win.style.left = r.left + 'px';
      win.style.top  = r.top  + 'px';
      win.style.transform = 'none';  // bỏ translate/scale để dùng left/top
      bringToFront(win);

      sl = r.left; st = r.top;
    }

    if (dragging) {
      const vw=innerWidth, vh=innerHeight, w=win.offsetWidth, h=win.offsetHeight;
      let x = sl + dx;
      let y = st + dy;

      // giữ trong màn hình
      x = Math.min(Math.max(0, x), vw - w);
      y = Math.min(Math.max(0, y), vh - h);

      win.style.left = x + 'px';
      win.style.top  = y + 'px';
    }
  });

  window.addEventListener('mouseup', ()=>{
    maybeDrag = false;
    dragging  = false;
  });

  // click vào popup -> nổi lên trên
  win.addEventListener('mousedown', ()=> bringToFront(win));
}

/* ========= init ========= */
document.addEventListener('DOMContentLoaded', () => {
  // bật kéo cho tất cả popup
  $$('.popup').forEach(enableDrag);

  // mở theo data-open (gắn trên thẻ bất kỳ)
  document.addEventListener('click', (e)=>{
    const opener = e.target.closest('[data-open]');
    if(opener){
      e.preventDefault();
      openPopup(opener.dataset.open);
    }
  });

  // tránh mousedown ở nút [x] dội lên header
  document.addEventListener('mousedown', (e)=>{
    if (e.target.matches('[data-close]')) e.stopPropagation();
  });

  // đóng theo data-close (nút [x])
  document.addEventListener('click', (e)=>{
    if(e.target.matches('[data-close]')){
      e.preventDefault();
      const pop = e.target.closest('.popup');
      if(pop) closePopup(pop);
    }
  });

  // auto-open popup có data-autoshow (nếu muốn)
  $$('.popup[data-autoshow]').forEach(pop => {
    setTimeout(() => openPopup(pop.id), 60);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const warn = document.getElementById("device-warning");
  const btn = document.getElementById("close-warning");

  if (window.innerWidth < 1025 && warn) {
    setTimeout(() => warn.classList.remove("hidden"), 800);
  }

  btn?.addEventListener("click", () => {
    warn.classList.add("hidden");
  });
});
/* ========= theme + icon toggle ========= */
function applyThemeIcons() {
  const dark = document.body.classList.contains("dark");
  $$(".theme-icon").forEach(img => {
    if (img.dataset.light && img.dataset.dark)
      img.src = dark ? img.dataset.dark : img.dataset.light;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // popup
  $$(".popup").forEach(enableDrag);

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      e.preventDefault();
      openPopup(opener.dataset.open);
    }
    if (e.target.matches("[data-close]")) {
      e.preventDefault();
      closePopup(e.target.closest(".popup"));
    }
  });

  // theme toggle
  const btnTheme = $("#btnTheme");
  const themeIcon = $("#themeIcon");
  const saved = localStorage.getItem("theme");

  if (saved === "dark") document.body.classList.add("dark");
  applyThemeIcons();
  themeIcon.src = document.body.classList.contains("dark")
    ? "./img/dark_mode_dark.webp"
    : "./img/dark_mode_light.webp";

  btnTheme?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
    themeIcon.src = dark
      ? "./img/dark_mode_dark.webp"
      : "./img/dark_mode_light.webp";
    applyThemeIcons();
  });
});

// ===== Unlock audio context trên iOS/Safari khi lần đầu user chạm =====
window.addEventListener('pointerdown', () => {
  try { Howler.ctx?.resume?.(); } catch {}
}, { once: true });

// =====Âm thanh UI mẫu (tuỳ bạn)=====
const sounds = {
  click: new Howl({ src: ['./sounds/click.mp3'], volume: 0.5 }),
  hover: new Howl({ src: ['./sounds/hover.mp3'], volume: 0.35 }),
  open : new Howl({ src: ['./sounds/popup_open.mp3'], volume: 0.5 }),
  close: new Howl({ src: ['./sounds/popup_close.mp3'], volume: 0.5 }),
};

// Gán hover/click cho các nút (tuỳ chọn)
document.querySelectorAll('button, a, .icon-menu a, .download_button').forEach(el => {
  el.addEventListener('mouseenter', () => sounds.hover.play());
  el.addEventListener('click',      () => sounds.click.play());
});

// ===== Toggle âm thanh với nút #btnSound =====
const SOUND_KEY = 'site:sound'; // 'on' | 'off'
const btnSound  = document.getElementById('btnSound');
const imgSound  = btnSound?.querySelector('img');

function isDark() {
  return document.body.classList.contains('dark');
}

function updateSoundIcon() {
  if (!imgSound) return;
  const muted = Howler._muted === true; // trạng thái hiện tại
  const src = muted
    ? (isDark() ? imgSound.dataset.offDark  : imgSound.dataset.offLight)
    : (isDark() ? imgSound.dataset.onDark   : imgSound.dataset.onLight);
  imgSound.src = src;
  imgSound.alt = muted ? 'Muted' : 'Sound on';
}

function setSoundFromStorage() {
  const v = localStorage.getItem(SOUND_KEY);
  const muted = (v === 'off');
  Howler.mute(muted);
  updateSoundIcon();
}

btnSound?.addEventListener('click', () => {
  const nextMuted = !Howler._muted;        // đảo trạng thái
  Howler.mute(nextMuted);
  localStorage.setItem(SOUND_KEY, nextMuted ? 'off' : 'on');
  updateSoundIcon();
  if (!nextMuted) sounds.click.play();     // click sound khi bật lại
});

// Gọi khi load
document.addEventListener('DOMContentLoaded', () => {
  setSoundFromStorage();
  updateSoundIcon();
});

// ==== Nếu bạn đã có nút theme, nhớ gọi lại updateSoundIcon() sau khi đổi theme ====
document.getElementById('btnTheme')?.addEventListener('click', () => {
  // ... code đổi theme của bạn ...
  // Sau khi thêm/bớt class 'dark' cho <body>, cập nhật icon âm thanh:
  updateSoundIcon();
});

// === Goobo hover sound ===
const goobo = document.querySelector('.frog');

if (goobo) {
  const gooboSound = new Howl({
    src: ['./sounds/goobo_hover.mp3'],
    volume: 0.6
  });

  goobo.addEventListener('mouseenter', () => {
    if (!Howler._muted) {   // chỉ phát khi chưa mute
      gooboSound.play();
    }
  });
}