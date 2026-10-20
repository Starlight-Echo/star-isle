// 微交互：滚动入场 + 背景光斑缓慢漂浮
document.addEventListener('DOMContentLoaded', () => {
  // 所有卡片与段落做入场动画
  document.querySelectorAll('.card, .about-box, .contact-line')
    .forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // 光斑漂浮
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
});
