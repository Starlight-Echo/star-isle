// 微交互：滚动入场 + 背景光斑漂浮 + 卡片鼠标视差光晕
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card, .phil-item, .essay, .tl-item, .quote, .contact-line, .contact-sub')
    .forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // 光斑缓慢漂浮
  const orbs = document.querySelectorAll('.bg-orb');
  let t = 0;
  (function drift() {
    t += 0.004;
    orbs.forEach((o, i) => {
      const s = 14 + i * 8;
      o.style.transform = `translate(${Math.sin(t + i) * s}px, ${Math.cos(t * 1.3 + i) * s}px)`;
    });
    requestAnimationFrame(drift);
  })();

  // 卡片跟随鼠标的柔光
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(124,108,255,.14), var(--bg-hover) 60%)`;
    });
    card.addEventListener('mouseleave', () => { card.style.background = ''; });
  });
});
