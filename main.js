// 小鲸鱼介绍页动态效果：深海气泡画布 · 进度条 · 卡片倾斜 · 滚动入场
document.addEventListener('DOMContentLoaded', () => {
  const isTouch = window.matchMedia('(hover: none)').matches;

  // ===== 深海气泡画布：气泡上浮，鼠标/手指附近会被轻轻推开并泛起涟漪 =====
  const canvas = document.getElementById('sea');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W, H, bubbles = [], pointer = { x: -1e4, y: -1e4 };

  const resize = () => {
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const n = Math.min(42, Math.floor(innerWidth / 28));
    bubbles = Array.from({ length: n }, () => spawn(true));
  };
  const spawn = anywhere => ({
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : H + 20 * dpr,
    r: (Math.random() * 3.2 + 1.2) * dpr,
    vy: (Math.random() * .45 + .25) * dpr,          // 上浮速度
    sway: Math.random() * Math.PI * 2,               // 左右摆相位
    swaySpeed: Math.random() * .012 + .006,
    hue: Math.random() < .75 ? 'blue' : 'mint',
  });
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { pointer.x = e.clientX * dpr; pointer.y = e.clientY * dpr; });
  addEventListener('pointerleave', () => { pointer.x = pointer.y = -1e4; });

  const RIPPLE = 110 * dpr, PUSH = 90 * dpr;
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const b of bubbles) {
      b.y -= b.vy * (1 + beatSmooth * 2.4);   // 音乐播放时气泡随节拍加速上浮
      b.sway += b.swaySpeed;
      b.x += Math.sin(b.sway) * .3 * dpr;
      // 指针靠近时轻轻推开
      const dx = b.x - pointer.x, dy = b.y - pointer.y, d = Math.hypot(dx, dy);
      if (d < PUSH && d > 1) { b.x += dx / d * 1.1 * dpr; b.y += dy / d * .8 * dpr; }
      if (b.y < -20 * dpr || b.x < -40 || b.x > W + 40) Object.assign(b, spawn(false));
      // 涟漪光圈
      if (d < RIPPLE) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r + 5 * dpr, 0, 7);
        ctx.strokeStyle = `rgba(125,232,216,${.22 * (1 - d / RIPPLE)})`;
        ctx.stroke();
      }
      const grad = ctx.createRadialGradient(b.x - b.r * .4, b.y - b.r * .4, b.r * .1, b.x, b.y, b.r);
      if (b.hue === 'blue') { grad.addColorStop(0, 'rgba(190,220,255,.9)'); grad.addColorStop(1, 'rgba(90,167,255,.25)'); }
      else { grad.addColorStop(0, 'rgba(210,255,246,.9)'); grad.addColorStop(1, 'rgba(125,232,216,.25)'); }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 7);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  })();

  // ===== 顶部阅读进度条 =====
  const bar = document.querySelector('.progress-bar') || (() => {
    const el = document.createElement('div');
    el.className = 'progress-bar';
    document.body.prepend(el);
    return el;
  })();
  addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight || 1)})`;
  }, { passive: true });

  // ===== 滚动入场 =====
  document.querySelectorAll('.card, .rule-item, .tl-item, .dossier, .bye-line').forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 70);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ===== 卡片 3D 倾斜 + 柔光（仅桌面） =====
  if (!isTouch) {
    document.querySelectorAll('.card, .rule-item').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -4.5;
        const ry = ((e.clientX - r.left) / r.width - .5) * 4.5;
        const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
        const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
        el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        el.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(90,167,255,.13), var(--bg-soft) 65%)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.background = ''; });
    });
  }

  // ===== 单曲播放器：播放时唱片旋转 + 均衡器跳动 + 全站律动 =====
  const song = document.getElementById('song');
  const songCard = document.querySelector('.song-card');
  let beat = 0, beatSmooth = 0;   // 律动值：气泡/光晕/标题共用

  if (song && songCard) {
    // 播放时用 WebAudio 分析低音，得到 0~1 的节拍值
    let actx, analyser, freqData;
    const startAnalyser = () => {
      if (actx) { actx.resume(); return; }
      try {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        const src = actx.createMediaElementSource(song);
        analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyser.connect(actx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
        (function feel() {
          analyser.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < 10; i++) sum += freqData[i];   // 低音区
          beat = sum / 10 / 255;
          beatSmooth = beatSmooth * 0.82 + beat * 0.18;      // 平滑
          document.documentElement.style.setProperty('--beat', beatSmooth.toFixed(3));
          requestAnimationFrame(feel);
        })();
      } catch { /* 分析失败不影响播放 */ }
    };
    song.addEventListener('play', () => {
      songCard.classList.add('playing');
      document.body.classList.add('dancing');
      startAnalyser();
    });
    song.addEventListener('pause', () => { songCard.classList.remove('playing'); document.body.classList.remove('dancing'); });
    song.addEventListener('ended', () => { songCard.classList.remove('playing'); document.body.classList.remove('dancing'); });
  }

  // ===== 标题渐变流动 =====
  document.querySelectorAll('.gradient-text').forEach(el => {
    el.style.backgroundSize = '200% 100%';
    el.animate(
      [{ backgroundPosition: '0% 50%' }, { backgroundPosition: '100% 50%' }, { backgroundPosition: '0% 50%' }],
      { duration: 9000, iterations: Infinity });
  });

  // ===== 触屏设备：下拉菜单点按展开 =====
  if (isTouch) {
    document.querySelectorAll('.has-sub > .menu-btn').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.stopPropagation();
        const parent = btn.parentElement;
        const wasOpen = parent.classList.contains('open');
        document.querySelectorAll('.has-sub.open').forEach(p => p.classList.remove('open'));
        if (!wasOpen) parent.classList.add('open');
      });
    });
    document.addEventListener('click', () =>
      document.querySelectorAll('.has-sub.open').forEach(p => p.classList.remove('open')));
  }
});
