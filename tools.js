// 小工具逻辑：计算器 / 倒计时番茄钟 / 字数统计 / 单位换算
document.addEventListener('DOMContentLoaded', () => {
  // ---- 标签切换 ----
  const tabs = document.querySelectorAll('.tool-tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tool-' + tab.dataset.tool).classList.add('active');
  }));

  // ---- 计算器 ----
  const display = document.getElementById('calc-display');
  const tryCalc = expr => {
    try {
      if (!/^[\d+\-*/().\s]+$/.test(expr)) return null;  // 只允许数字与四则符号
      const val = Function('"use strict";return (' + expr + ')')();
      if (typeof val !== 'number' || !isFinite(val)) return null;
      return Math.round(val * 1e10) / 1e10;
    } catch { return null; }
  };
  const press = k => {
    if (k === 'C') { display.value = ''; return; }
    if (k === '←') { display.value = display.value.slice(0, -1); return; }
    if (k === '=') {
      const v = tryCalc(display.value);
      display.value = v === null ? '错误' : String(v);
      return;
    }
    display.value += k;
  };
  document.querySelectorAll('.calc-keys button').forEach(b =>
    b.addEventListener('click', () => press(b.dataset.k)));
  display.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); press('='); }
    else if (/^[\d+\-*/().]$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete') { /* 让浏览器默认处理 */ }
    else e.preventDefault();
  });

  // ---- 倒计时 / 番茄钟 ----
  const face = document.getElementById('timer-face');
  const startBtn = document.getElementById('timer-start');
  const resetBtn = document.getElementById('timer-reset');
  let total = 25 * 60, left = total, running = null;

  const render = () => {
    const m = String(Math.floor(left / 60)).padStart(2, '0');
    const s = String(left % 60).padStart(2, '0');
    face.textContent = `${m}:${s}`;
    document.title = running ? `${m}:${s} · 专注中` : '星屿集 · 诗选 — 测试网站';
  };
  const stop = () => { clearInterval(running); running = null; startBtn.textContent = '开始'; };

  const ring = () => {
    face.classList.add('done');
    stop();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [880, 1108.7, 1318.5];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f; o.type = 'sine';
        g.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.25);
        g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.25 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.7);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.25); o.stop(ctx.currentTime + i * 0.25 + 0.8);
      });
      setTimeout(() => { alert('⏰ 时间到！休息一下吧。'); face.classList.remove('done'); }, 300);
    } catch { face.classList.remove('done'); alert('⏰ 时间到！'); }
  };

  startBtn.addEventListener('click', () => {
    if (running) { stop(); render(); return; }        // 暂停
    if (left <= 0) left = total;
    running = setInterval(() => {
      left--;
      if (left <= 0) { left = 0; render(); ring(); }
      else render();
    }, 1000);
    startBtn.textContent = '暂停';
  });
  resetBtn.addEventListener('click', () => { stop(); left = total; render(); });
  document.querySelectorAll('.preset').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('.preset').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    stop(); total = left = p.dataset.min * 60; render();
  }));
  render();

  // ---- 字数统计 ----
  const countInput = document.getElementById('count-input');
  const set = (id, v) => document.getElementById(id).textContent = v;
  countInput.addEventListener('input', () => {
    const t = countInput.value;
    set('c-total', t.length);
    set('c-han', (t.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length);
    set('c-word', (t.match(/[a-zA-Z]+(?:['’-][a-zA-Z]+)*/g) || []).length);
    set('c-punc', (t.match(/[\p{P}\p{S}]/gu) || []).length);
    set('c-line', t === '' ? 0 : t.split(/\r\n|\r|\n/).length);
    set('c-space', (t.match(/ /g) || []).length);
  });

  // ---- 单位换算 ----
  const UNITS = {
    len:  { units: [['m','米'], ['km','千米'], ['cm','厘米'], ['mm','毫米'], ['mile','英里'], ['ft','英尺'], ['inch','英寸']],
            toM: { m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, ft:0.3048, inch:0.0254 } },
    weight:{ units: [['kg','千克'], ['g','克'], ['t','吨'], ['lb','磅'], ['oz','盎司']],
            toM: { kg:1, g:0.001, t:1000, lb:0.45359237, oz:0.028349523125 } },
    temp: { units: [['c','摄氏度 °C'], ['f','华氏度 °F'], ['k','开尔文 K']] }
  };
  const cat = document.getElementById('unit-cat');
  const from = document.getElementById('unit-from');
  const to = document.getElementById('unit-to');
  const input = document.getElementById('unit-in');
  const out = document.getElementById('unit-out');

  const fill = () => {
    const list = UNITS[cat.value].units;
    from.innerHTML = list.map(u => `<option value="${u[0]}">${u[1]}</option>`).join('');
    to.innerHTML = from.innerHTML;
    to.selectedIndex = 1;
    convert();
  };
  const toC = v => cat.value === 'temp' && from.value === 'f' ? (v - 32) * 5 / 9
             : cat.value === 'temp' && from.value === 'k' ? v - 273.15 : v;
  const fromC = v => cat.value === 'temp' && to.value === 'f' ? v * 9 / 5 + 32
             : cat.value === 'temp' && to.value === 'k' ? v + 273.15 : v;
  const convert = () => {
    const v = parseFloat(input.value);
    if (isNaN(v)) { out.textContent = '—'; return; }
    let r;
    if (cat.value === 'temp') r = fromC(toC(v));
    else r = v * UNITS[cat.value].toM[from.value] / UNITS[cat.value].toM[to.value];
    out.textContent = Math.round(r * 1e6) / 1e6;
  };
  cat.addEventListener('change', fill);
  [from, to, input].forEach(el => el.addEventListener('input', convert));
  fill();
});
