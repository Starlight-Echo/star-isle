// 小鲸鱼的鱼缸 v15：整屏首屏 · 无冗余状态文案 · 对称频谱 · 全局律动 · 单文件可播
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mood = { beat: 0 };   // beat 驱动背景气泡
  const setPlaying = (on) => {
    document.body.classList.toggle('is-playing', on);
  };

  /* ================= 首屏高度（公告栏 + 导航的实际高度） ================= */
  (() => {
    const measureTop = () => {
      const notice = $('.notice');
      const nav = $('.nav');
      const noticeH = notice ? notice.offsetHeight : 0;
      const navH = nav ? nav.offsetHeight : 62;
      document.documentElement.style.setProperty('--top-h', (noticeH + navH) + 'px');
      document.documentElement.style.setProperty('--nav-h', navH + 'px');
    };
    measureTop();
    addEventListener('resize', measureTop, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureTop);
  })();

  /* ================= 背景气泡（离屏精灵，低开销） ================= */
  (() => {
    const canvas = $('#sea');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, bubbles = [], raf = 0, last = 0;
    const sprites = {};

    const makeSprite = (mid, edge) => {
      const size = 64;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const grad = g.createRadialGradient(23, 21, 2, 32, 32, 30);
      grad.addColorStop(0, 'rgba(255,255,255,.95)');
      grad.addColorStop(.62, mid);
      grad.addColorStop(1, edge);
      g.fillStyle = grad;
      g.beginPath(); g.arc(32, 32, 29, 0, Math.PI * 2); g.fill();
      g.strokeStyle = edge; g.lineWidth = 1.4;
      g.beginPath(); g.arc(32, 32, 29, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)';
      g.beginPath(); g.arc(23, 21, 5.5, 0, Math.PI * 2); g.fill();
      return c;
    };

    const spawn = (anywhere) => ({
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 30 * dpr,
      r: (Math.random() * 9 + 5) * dpr,
      vy: (Math.random() * 10 + 7) * dpr,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * .5 + .3,
      amp: (Math.random() * 5 + 4) * dpr,
      mint: Math.random() < .32,
      alpha: Math.random() * .3 + .35,
    });

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, innerWidth < 680 ? 1.1 : 1.25);
      W = canvas.width = Math.round(innerWidth * dpr);
      H = canvas.height = Math.round(innerHeight * dpr);
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      if (!sprites.blue) {
        sprites.blue = makeSprite('rgba(196,232,255,.5)', 'rgba(125,193,245,.45)');
        sprites.mint = makeSprite('rgba(203,247,238,.5)', 'rgba(122,222,203,.45)');
      }
      const count = innerWidth < 680 ? 10 : Math.min(18, Math.floor(innerWidth / 80));
      bubbles = Array.from({ length: count }, () => spawn(true));
    };

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) { last = now; return; }
      if (now - last < 33) return;
      const dt = Math.min(.05, (now - last) / 1000 || 0);
      last = now;
      ctx.clearRect(0, 0, W, H);
      const lift = 1 + mood.beat * 1.3;
      for (const b of bubbles) {
        b.y -= b.vy * lift * dt;
        b.phase += b.speed * dt;
        const x = b.x + Math.sin(b.phase) * b.amp;
        if (b.y < -b.r * 2 || x < -b.r * 3 || x > W + b.r * 3) { Object.assign(b, spawn(false)); continue; }
        ctx.globalAlpha = b.alpha;
        ctx.drawImage(b.mint ? sprites.mint : sprites.blue, x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
    };

    resize();
    let resizeTimer = 0;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 220);
    }, { passive: true });

    if (reduceMotion) {
      // 静态铺一层即可
      ctx.clearRect(0, 0, W, H);
      for (const b of bubbles) {
        ctx.globalAlpha = b.alpha;
        ctx.drawImage(b.mint ? sprites.mint : sprites.blue, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
    } else {
      last = performance.now();
      raf = requestAnimationFrame(draw);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) last = performance.now();
        if (!document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
      });
    }
  })();

  /* ================= 滚动进度 / 导航高亮 / 入场 ================= */
  const progress = $('#progress');
  const links = [...document.querySelectorAll('.menu a')];
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  let scrollQueued = false;
  const updateScroll = () => {
    scrollQueued = false;
    const el = document.documentElement;
    const max = el.scrollHeight - el.clientHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
    if (!sections.length) return;
    const line = scrollY + innerHeight * .32;
    let current = null;
    for (const s of sections) {
      if (s.getBoundingClientRect().top + scrollY <= line) current = s;
    }
    for (const a of links) {
      a.classList.toggle('active', !!current && a.getAttribute('href') === '#' + current.id);
    }
  };
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const revealEls = [...document.querySelectorAll('.card, .day-card, .secret, .player')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    revealEls.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    }, { threshold: .1 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ================= 播放器 ================= */
  const audio = $('#song');
  const player = $('#player');
  if (!audio || !player) return;
  audio.volume = 1;
  audio.muted = false;

  const playBtn = $('#playBtn');
  const discBtn = $('#discBtn');
  const seek = $('#seek');
  const curEl = $('#cur');
  const durEl = $('#dur');
  const statusEl = $('#status');
  const wave = $('#wave');

  const fmt = (sec) => {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  };
  const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

  let actx = null;
  let analyser = null;
  let freq = null;
  let wired = false;
  // 本地 file:// 下 WebAudio 可能吞掉媒体声音，直接走原生播放 + 合成频谱
  const canAnalyse = location.protocol !== 'file:';
  const ensureGraph = () => {
    if (!canAnalyse) return false;
    if (wired) return true;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      actx = new Ctx();
      const source = actx.createMediaElementSource(audio);
      try {
        analyser = actx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = .82;
        analyser.minDecibels = -80;
        analyser.maxDecibels = -30;
        source.connect(analyser);
        analyser.connect(actx.destination);
      } catch {
        source.connect(actx.destination);
        analyser = null;
        freq = null;
      }
      if (analyser) freq = new Uint8Array(analyser.frequencyBinCount);
      wired = true;
      return true;
    } catch {
      return false;
    }
  };
  const resumeGraph = () => {
    if (actx && actx.state === 'suspended') actx.resume().catch(() => {});
  };

  const isPlaying = () => !audio.paused && !audio.ended;

  const syncLabels = (playing) => {
    const label = playing ? '暂停' : '播放';
    if (playBtn) playBtn.setAttribute('aria-label', label + '《云女孩》');
    if (discBtn) discBtn.setAttribute('aria-label', label + '《云女孩》');
  };

  const setBuffered = () => {
    if (!seek || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    let end = 0;
    for (let i = 0; i < audio.buffered.length; i++) {
      if (audio.buffered.start(i) <= audio.currentTime + .1) end = Math.max(end, audio.buffered.end(i));
    }
    if (!end) end = audio.buffered.length ? audio.buffered.end(audio.buffered.length - 1) : 0;
    const bufPct = Math.min(100, end / audio.duration * 100);
    const playPct = Math.min(100, audio.currentTime / audio.duration * 100);
    seek.style.setProperty('--buf', Math.max(bufPct, playPct).toFixed(2));
  };

  let draggingSeek = false;
  const syncSeek = () => {
    if (!seek || !Number.isFinite(audio.duration) || audio.duration <= 0 || draggingSeek) return;
    const pct = Math.min(100, Math.max(0, audio.currentTime / audio.duration * 100));
    seek.value = Math.round(pct * 10);
    seek.style.setProperty('--p', pct.toFixed(2));
    if (curEl) curEl.textContent = fmt(audio.currentTime);
  };

  const syncMeta = () => {
    if (!durEl) return;
    durEl.textContent = fmt(audio.duration);
    if (seek) seek.disabled = false;
  };

  /* --- 频谱画布：居中镜像 + 每频段归一化 --- */
  const wctx = wave ? wave.getContext('2d') : null;
  let waveW = 0, waveH = 0, waveDpr = 1, waveGrad = null;
  let levels = new Float32Array(40);
  let refs = new Float32Array(40);
  let waveRaf = 0, waveRunning = false, lastWave = 0, waveVisible = true;

  const lensAt = (i, n) => .70 + .30 * Math.sin(Math.PI * i / (n - 1));

  const sizeWave = () => {
    if (!wave || !wctx) return;
    const rect = wave.getBoundingClientRect();
    if (!rect.width) return;
    waveDpr = Math.min(devicePixelRatio || 1, 2);
    waveW = rect.width;
    waveH = rect.height;
    wave.width = Math.round(waveW * waveDpr);
    wave.height = Math.round(waveH * waveDpr);
    wctx.setTransform(waveDpr, 0, 0, waveDpr, 0, 0);
    waveGrad = wctx.createLinearGradient(0, 0, waveW, 0);
    waveGrad.addColorStop(0, 'rgba(47, 155, 234, .62)');
    waveGrad.addColorStop(.38, 'rgba(47, 182, 224, .92)');
    waveGrad.addColorStop(.62, 'rgba(42, 210, 198, .92)');
    waveGrad.addColorStop(1, 'rgba(31, 201, 173, .62)');
    const count = Math.max(28, Math.min(60, Math.round(waveW / 8)));
    if (count !== levels.length) {
      levels = new Float32Array(count);
      refs = new Float32Array(count);
    }
    drawWaveFrame(false);
  };

  const roundBar = (x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    wctx.beginPath();
    wctx.moveTo(x + rr, y);
    wctx.arcTo(x + w, y, x + w, y + h, rr);
    wctx.arcTo(x + w, y + h, x, y + h, rr);
    wctx.arcTo(x, y + h, x, y, rr);
    wctx.arcTo(x, y, x + w, y, rr);
    wctx.closePath();
  };

  const drawWaveFrame = (live) => {
    if (!wctx || !waveW || !waveH) return;
    wctx.clearRect(0, 0, waveW, waveH);
    const n = levels.length;
    const slot = waveW / n;
    const barW = Math.max(2, slot - Math.max(2.4, slot * .36));
    const mid = waveH / 2;
    const maxHalf = mid - 3;

    wctx.strokeStyle = 'rgba(47, 155, 234, .16)';
    wctx.lineWidth = 1;
    wctx.beginPath();
    wctx.moveTo(0, Math.round(mid) + .5);
    wctx.lineTo(waveW, Math.round(mid) + .5);
    wctx.stroke();

    wctx.fillStyle = waveGrad || 'rgba(47, 155, 234, .55)';
    for (let i = 0; i < n; i++) {
      const lens = lensAt(i, n);
      let v;
      if (live) {
        v = levels[i];
      } else {
        const ripple = .5 + .5 * Math.sin(i * .52 + 1.1);
        v = (.10 + ripple * .055) * lens;
      }
      const half = 1.6 + v * maxHalf;
      const x = i * slot + (slot - barW) / 2;
      roundBar(x, mid - half, barW, half * 2, barW / 2);
      wctx.fill();
    }
  };

  const loopWave = (now) => {
    if (!waveRunning) return;
    waveRaf = requestAnimationFrame(loopWave);
    if (document.hidden) return;
    if (now - lastWave < 33) return;
    lastWave = now;

    const n = levels.length;
    const playing = isPlaying();
    let live = false;

    if (analyser && freq && playing) {
      analyser.getByteFrequencyData(freq);
      let low = 0;
      for (let i = 1; i < 11; i++) low += freq[i];
      low /= 10;
      mood.beat = Math.min(1, (low / 255) * 1.4);
      const half = Math.ceil(n / 2);
      const maxIdx = Math.max(8, Math.floor(freq.length * .74));
      for (let i = 0; i < half; i++) {
        const k = half > 1 ? 1 - i / (half - 1) : 0;   // 1 = 最外侧，0 = 正中间
        const idx = Math.min(maxIdx, Math.max(1, Math.round(Math.pow(maxIdx, k))));
        const raw = freq[idx] / 255;
        refs[i] = refs[i] ? refs[i] * .955 + raw * .045 : raw;
        const norm = Math.min(1, raw / Math.max(.085, refs[i] * 1.7));
        const target = (.14 + .86 * norm) * (1 - .30 * k);
        levels[i] = Math.max(target, levels[i] * .80);
        levels[n - 1 - i] = levels[i];
      }
      live = true;
    } else if (playing) {
      const t = now / 1000;
      const half = Math.ceil(n / 2);
      for (let i = 0; i < half; i++) {
        const k = half > 1 ? 1 - i / (half - 1) : 0;
        const waveV = (.16 + .28 * Math.abs(Math.sin(t * 1.8 + k * 3.1))) * (.58 + .42 * (1 - k));
        levels[i] = Math.max(waveV, levels[i] * .86);
        levels[n - 1 - i] = levels[i];
      }
      mood.beat = .45 + .3 * Math.sin(t * 2.1);
      live = true;
    } else {
      let alive = false;
      for (let i = 0; i < n; i++) {
        levels[i] *= .88;
        if (levels[i] > .01) alive = true;
      }
      mood.beat *= .9;
      if (!alive) {
        waveRunning = false;
        cancelAnimationFrame(waveRaf);
        waveRaf = 0;
        drawWaveFrame(false);
        return;
      }
    }
    if (waveVisible) drawWaveFrame(live);
  };

  if (wave && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      waveVisible = entries.some(entry => entry.isIntersecting);
      if (waveVisible && !waveRunning) drawWaveFrame(false);
    }, { threshold: 0 }).observe(wave);
  }

  const startWave = () => {
    if (reduceMotion || !wave || waveRunning) return;
    waveRunning = true;
    lastWave = 0;
    waveRaf = requestAnimationFrame(loopWave);
  };

  /* --- 播放控制 --- */
  const startPlayback = async () => {
    ensureGraph();
    resumeGraph();
    if (audio.ended) audio.currentTime = 0;
    try {
      await audio.play();
    } catch {
      setStatus('浏览器没让播放，再点一次试试');
    }
  };
  const toggle = () => {
    if (audio.paused || audio.ended) startPlayback();
    else audio.pause();
  };
  if (playBtn) playBtn.addEventListener('click', toggle);
  if (discBtn) discBtn.addEventListener('click', toggle);

  audio.addEventListener('loadedmetadata', syncMeta);
  audio.addEventListener('durationchange', syncMeta);
  if (seek) seek.disabled = false;

  audio.addEventListener('timeupdate', () => {
    syncSeek();
    setBuffered();
  });
  audio.addEventListener('progress', setBuffered);

  audio.addEventListener('play', () => {
    player.classList.add('playing');
    setPlaying(true);
    syncLabels(true);
    setStatus('');
    ensureGraph();
    resumeGraph();
    startWave();
  });
  audio.addEventListener('playing', () => {
    player.classList.remove('buffering');
    setStatus('');
    startWave();
  });
  audio.addEventListener('pause', () => {
    player.classList.remove('playing');
    setPlaying(false);
    syncLabels(false);
    if (!audio.ended) setStatus('');
    startWave();   // 让频谱平滑落下后自己停
  });
  audio.addEventListener('ended', () => {
    player.classList.remove('playing');
    setPlaying(false);
    syncLabels(false);
    mood.beat = 0;
    setStatus('');
    startWave();
  });
  audio.addEventListener('waiting', () => {
    player.classList.add('buffering');
    if (!audio.paused) setStatus('正在缓冲…');
  });
  audio.addEventListener('canplay', () => player.classList.remove('buffering'));
  audio.addEventListener('error', () => {
    player.classList.remove('buffering');
    setPlaying(false);
    setStatus('音频加载失败，刷新页面后再点一次');
  });

  if (seek) {
    const applySeek = () => {
      const pct = Math.max(0, Math.min(100, Number(seek.value) / 10));
      seek.style.setProperty('--p', pct.toFixed(2));
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = pct / 100 * audio.duration;
        if (curEl) curEl.textContent = fmt(audio.currentTime);
        setBuffered();
      }
    };
    seek.addEventListener('input', () => { draggingSeek = true; applySeek(); });
    seek.addEventListener('change', () => { draggingSeek = false; applySeek(); });
    seek.addEventListener('pointerdown', () => { draggingSeek = true; });
    addEventListener('pointerup', () => { if (draggingSeek) { draggingSeek = false; syncSeek(); setBuffered(); } }, { passive: true });
  }

  /* --- 预取：滚动到附近再整段加载，首播不干等 --- */
  let prefetched = false;
  const prefetch = () => {
    if (prefetched || !audio.paused) return;
    prefetched = true;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /(^|-)2g/.test(conn.effectiveType || ''))) return;
    try {
      audio.preload = 'auto';
      audio.load();
    } catch {}
  };
  if ('IntersectionObserver' in window) {
    const near = new IntersectionObserver((entries, obs) => {
      if (entries.some(e => e.isIntersecting)) { prefetch(); obs.disconnect(); }
    }, { rootMargin: '400px 0px' });
    near.observe(player);
  }
  player.addEventListener('pointerenter', prefetch, { once: true });
  player.addEventListener('focusin', prefetch, { once: true });

  /* --- 尺寸 --- */
  if (wave) {
    if ('ResizeObserver' in window) {
      let t = 0;
      const ro = new ResizeObserver(() => {
        clearTimeout(t);
        t = setTimeout(sizeWave, 120);
      });
      ro.observe(wave);
    } else {
      addEventListener('resize', () => setTimeout(sizeWave, 200), { passive: true });
    }
  }
  sizeWave();
  syncLabels(false);
  syncMeta();
})();
