// 动态美学：星空连线画布 · 阅读进度条 · 诗卡 3D 倾斜 · 滚动入场
document.addEventListener('DOMContentLoaded', () => {
  const isTouch = window.matchMedia('(hover: none)').matches;

  // ===== 星空连线画布（鼠标/手指附近的星星会被牵动并连线） =====
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], pointer = { x: -1e4, y: -1e4 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const resize = () => {
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const n = Math.min(90, Math.floor(innerWidth * innerHeight / 16000));
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .18 * dpr, vy: (Math.random() - .5) * .18 * dpr,
      r: (Math.random() * 1.3 + .5) * dpr,
      tw: Math.random() * Math.PI * 2,   // 闪烁相位
    }));
  };
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { pointer.x = e.clientX * dpr; pointer.y = e.clientY * dpr; });
  addEventListener('pointerleave', () => { pointer.x = pointer.y = -1e4; });

  const LINK = 130 * dpr, PULL = 170 * dpr;
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.x += s.vx; s.y += s.vy; s.tw += .03;
      if (s.x < 0 || s.x > W) s.vx *= -1;
      if (s.y < 0 || s.y > H) s.vy *= -1;
      // 指针附近轻微牵引
      const dx = s.x - pointer.x, dy = s.y - pointer.y, d = Math.hypot(dx, dy);
      if (d < PULL && d > 1) { s.x += dx / d * .6; s.y += dy / d * .6; }
      const a = .35 + Math.abs(Math.sin(s.tw)) * .5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 7);
      ctx.fillStyle = `rgba(200,210,255,${a})`;
      ctx.fill();
    }
    // 星与星、星与指针连线
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i], b = stars[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(139,124,255,${.16 * (1 - d / LINK)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dp = Math.hypot(stars[i].x - pointer.x, stars[i].y - pointer.y);
      if (dp < LINK * 1.4) {
        ctx.strokeStyle = `rgba(62,230,210,${.35 * (1 - dp / (LINK * 1.4))})`;
        ctx.beginPath(); ctx.moveTo(stars[i].x, stars[i].y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  })();

  // ===== 顶部阅读进度条 =====
  const bar = document.getElementById('progress');
  addEventListener('scroll', () => {
    const h = document.documentElement;
    const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.transform = `scaleX(${p})`;
  }, { passive: true });

  // ===== 滚动入场 =====
  document.querySelectorAll('.poem, .essay-block, .contact-line').forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 70);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ===== 诗卡 3D 倾斜跟随（仅桌面） =====
  if (!isTouch) {
    document.querySelectorAll('.poem').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -5;
        const ry = ((e.clientX - r.left) / r.width - .5) * 5;
        const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
        const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
        card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(139,124,255,.13), var(--bg-soft) 65%)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; card.style.background = ''; });
    });
  }

  // ===== 标题渐变随滚动微微流动 =====
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
