
const canvas = document.getElementById('fx-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles;
function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  particles = Array.from({length: Math.min(160, Math.floor(W*H/18000))}, () => ({
    x: Math.random()*W,
    y: Math.random()*H,
    vx: (Math.random()-.5)*0.6,
    vy: (Math.random()-.5)*0.6,
    r: Math.random()*1.8+0.6
  }));
}
window.addEventListener('resize', resize);
resize();
function step(){
  ctx.clearRect(0,0,W,H);
  
  const g = ctx.createRadialGradient(W*0.7, H*0.2, 50, W*0.7, H*0.2, Math.max(W,H));
  g.addColorStop(0, 'rgba(0,229,255,0.10)');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // particles
  ctx.fillStyle = 'rgba(190,255,255,0.9)';
  for(const p of particles){
    p.x+=p.vx; p.y+=p.vy;
    if(p.x<0||p.x>W) p.vx*=-1;
    if(p.y<0||p.y>H) p.vy*=-1;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  }

  // neon link lines
  ctx.strokeStyle = 'rgba(0,229,255,0.35)';
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const a = particles[i], b = particles[j];
      const dx=a.x-b.x, dy=a.y-b.y, d=dx*dx+dy*dy;
      if(d < 130*130){
        ctx.globalAlpha = 1 - d/(130*130);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(step);
}
step();


const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
  });
},{ threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));


const barObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.style.setProperty('--w', e.target.dataset.value + '%');
      e.target.style.position = 'relative';
      e.target.style.setProperty('overflow', 'hidden');
      e.target.style.setProperty('borderRadius', '999px');
      e.target.style.setProperty('height', '12px');
      e.target.style.setProperty('background', 'rgba(255,255,255,.12)');
      
      requestAnimationFrame(()=>{
        e.target.style.setProperty('--width-final','1');
        e.target.style.setProperty('width','100%');
        e.target.style.setProperty('display','block');
        e.target.style.setProperty('position','relative');
        e.target.style.setProperty('transition','none');
        e.target.style.setProperty('--_done', '1');
        e.target.style.setProperty('clipPath','inset(0 0 0 0)');
        e.target.style.setProperty('boxShadow','inset 0 0 0 0 rgba(0,0,0,0)');
        e.target.style.setProperty('--_w', e.target.dataset.value + '%');
        e.target.style.setProperty('--_grad','linear-gradient(90deg, #00e5ff, #8b5cf6)');
        e.target.style.setProperty('background','rgba(255,255,255,.12)');
        e.target.style.setProperty('position','relative');
        e.target.style.setProperty('overflow','hidden');
        
        const inner = document.createElement('b');
        inner.style.position='absolute'; inner.style.left='0'; inner.style.top='0'; inner.style.height='100%';
        inner.style.width='0%'; inner.style.background='linear-gradient(90deg,#00e5ff,#8b5cf6)';
        inner.style.boxShadow='0 0 20px rgba(0,229,255,.5)';
        inner.style.transition='width 1200ms cubic-bezier(.2,.6,.2,1)';
        e.target.appendChild(inner);
        requestAnimationFrame(()=> inner.style.width = e.target.dataset.value + '%');
      });
      barObserver.unobserve(e.target);
    }
  });
},{ threshold:.3 });
document.querySelectorAll('.bar').forEach(el => barObserver.observe(el));


const tiltWrap = document.querySelector('.photo-3d');
if(tiltWrap){
  const img = tiltWrap.querySelector('img');
  tiltWrap.addEventListener('mousemove', (e)=>{
    const r = tiltWrap.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - .5;
    const py = (e.clientY - r.top)/r.height - .5;
    img.style.transform = `rotateY(${px*12}deg) rotateX(${ -py*8 }deg) scale(1.02)`;
  });
  tiltWrap.addEventListener('mouseleave', ()=>{
    img.style.transform = 'rotateY(8deg) rotateX(3deg)';
  });
}


(function(){
  const curtain = document.getElementById('page-transition');
  if(!curtain) return;
  document.querySelectorAll('.nav a').forEach(a => {
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        e.preventDefault();
        curtain.classList.add('active');
        setTimeout(()=>{
          document.querySelector(href)?.scrollIntoView({behavior:'smooth', block:'start'});
          setTimeout(()=> curtain.classList.remove('active'), 500);
        }, 200);
      }
    });
  });
})();


// ===== Typewriter Intro =====
(function(){
  const overlay = document.getElementById('intro-overlay');
  const target = document.getElementById('typewriter');
  const msg = "Xin chào, mình là Đỗ Huy Cường — 27TH02\nKhoa Công Nghệ Thông Tin.";
  if(!overlay || !target) return;
  document.body.classList.add('locked');
  let i = 0;
  function type(){
    if(i <= msg.length){
      target.textContent = msg.slice(0, i);
      i++;
      setTimeout(type, 28); // tốc độ gõ
    }else{
      setTimeout(()=>{
        overlay.classList.add('hidden');
        document.body.classList.remove('locked');
        // trigger reveal cho phần đang ở trong viewport
        document.querySelectorAll('.reveal').forEach(el=>{
          const r = el.getBoundingClientRect();
          if(r.top < window.innerHeight - 50) el.classList.add('visible');
        });
      }, 600);
    }
  }
  type();
})();


// ==== HOBBY CLICK EFFECT ====
(() => {
  const hobbyCards = document.querySelectorAll(".hobby.card");
  if (!hobbyCards.length) return;

  hobbyCards.forEach(card => {
    card.style.cursor = "pointer";

    card.addEventListener("click", (e) => {
      // Toggle active state
      card.classList.toggle("active");

      // Create ripple
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const rect = card.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size/2) + "px";
      ripple.style.top  = (e.clientY - rect.top  - size/2) + "px";
      card.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    // Keyboard accessibility
    card.tabIndex = 0;
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });
})();

// ==== GALLERY SEQUENTIAL REVEAL ON SCROLL ====
(() => {
  const galleryImages = document.querySelectorAll(".gallery img");
  if (!galleryImages.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const imgs = [...galleryImages];
        imgs.forEach((img, i) => {
          setTimeout(() => img.classList.add("visible"), i * 160);
        });
        io.disconnect(); // run once
      }
    });
  }, { threshold: 0.2 });

  io.observe(galleryImages[0]);
})();



// === THEME TOGGLE + SOUND ===
(() => {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  // Load persisted theme or prefers-color-scheme
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    root.setAttribute("data-theme", "light");
  }

  
  let audioCtx;
  function playTone(freq=660, dur=110) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0.12, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur/1000);
      o.start();
      o.stop(audioCtx.currentTime + dur/1000);
    } catch(e){ /* ignore */ }
  }

  function toggleTheme() {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    
    if (next === "light") { playTone(760, 120); setTimeout(()=>playTone(920, 90), 80); }
    else { playTone(380, 120); setTimeout(()=>playTone(300, 90), 80); }
  }

  btn.addEventListener("click", toggleTheme);
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTheme(); }
  });
})();



(() => {
  const root = document.documentElement;
  const sw = document.getElementById("themeSwitch");
  const label = document.querySelector(".theme-switch .theme-label");
  if (!sw) return;

  
  const saved = localStorage.getItem("theme");
  let theme = (saved === "light" || saved === "dark") ? saved
             : (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? "light" : "dark");
  root.setAttribute("data-theme", theme);
  sw.checked = theme === "light";
  label && (label.textContent = theme === "light" ? "Light" : "Dark");

  let audioCtx;
  function playTone(freq=660, dur=110) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = freq; o.type = "sine";
      g.gain.setValueAtTime(0.12, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur/1000);
      o.start(); o.stop(audioCtx.currentTime + dur/1000);
    } catch(e){}
  }

  function apply(next) {
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (label) label.textContent = next === "light" ? "Light" : "Dark";
    if (next === "light") { playTone(760, 120); setTimeout(()=>playTone(920, 90), 80); }
    else { playTone(380, 120); setTimeout(()=>playTone(300, 90), 80); }
  }

  sw.addEventListener("change", () => {
    apply(sw.checked ? "light" : "dark");
  });

})();



(() => {
  const sec = document.querySelector(".info-section");
  if (!sec) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        sec.classList.add("visible");
        io.disconnect();
      }
    });
  }, { threshold: 0.2 });
  io.observe(sec);
})();



(() => {
  const items = document.querySelectorAll(".skill-ring");
  if (!items.length) return;

  const SIZE = 120, R = 52, CX = 60, CY = 60;
  const C = 2 * Math.PI * R;

  function build(item){
    const percent = Math.max(0, Math.min(100, parseInt(item.dataset.percent || "0", 10)));
    const colorVar = item.dataset.color || "--primary";
    const label = item.dataset.label || "";

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 120 120");

    const track = document.createElementNS(svgNS, "circle");
    track.setAttribute("class", "track");
    track.setAttribute("cx", CX); track.setAttribute("cy", CY); track.setAttribute("r", R);
    track.setAttribute("fill", "transparent"); track.setAttribute("stroke-width", "10");

    const progress = document.createElementNS(svgNS, "circle");
    progress.setAttribute("class", "progress");
    progress.setAttribute("cx", CX); progress.setAttribute("cy", CY); progress.setAttribute("r", R);
    progress.setAttribute("fill", "transparent");
    progress.setAttribute("stroke-width", "10");
    progress.setAttribute("stroke-linecap", "round");
    progress.style.stroke = getComputedStyle(document.documentElement).getPropertyValue(colorVar) || "#22d3ee";
    progress.style.strokeDasharray = C.toString();
    progress.style.strokeDashoffset = C.toString();
    progress.style.transform = "rotate(-90deg)";
    progress.style.transformOrigin = "60px 60px";

    svg.appendChild(track);
    svg.appendChild(progress);

    const value = document.createElement("div");
    value.className = "value";
    value.textContent = percent + "%";

    const labelEl = document.createElement("div");
    labelEl.className = "label";
    labelEl.textContent = label;

    item.appendChild(svg);
    item.appendChild(value);
    item.appendChild(labelEl);

    item.addEventListener("mouseenter", () => {
      progress.style.transition = "stroke-dashoffset .8s ease, stroke .2s ease";
      item.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-6px)' }
      ], { duration: 220, fill: 'forwards', easing: 'cubic-bezier(.2,.6,.2,1)' });
    });
    item.addEventListener("mouseleave", () => {
      item.animate([
        { transform: 'translateY(-6px)' },
        { transform: 'translateY(0)' }
      ], { duration: 220, fill: 'forwards', easing: 'cubic-bezier(.2,.6,.2,1)' });
    });

    return { progress, percent };
  }

  const objs = Array.from(items).map(build);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const i = Array.from(items).indexOf(e.target);
        const obj = objs[i];
        if (!obj) return;
        e.target.classList.add("visible");
        const targetOffset = (1 - obj.percent/100) * C;
        setTimeout(() => { obj.progress.style.strokeDashoffset = targetOffset.toString(); }, 120 + i*140);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });

  items.forEach(el => io.observe(el));

  window.addEventListener("storage", () => {
    objs.forEach((o, idx) => {
      const el = items[idx];
      const colorVar = el.dataset.color || "--primary";
      o.progress.style.stroke = getComputedStyle(document.documentElement).getPropertyValue(colorVar) || "#22d3ee";
    });
  });
})();

