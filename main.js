// 微交互：入场动画 + 光斑漂浮 + 卡片柔光 + 移动端下拉点按
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.poem, .essay-block, .contact-line')
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
  document.querySelectorAll('.poem').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(139,124,255,.14), var(--bg-soft) 60%)`;
    });
    card.addEventListener('mouseleave', () => { card.style.background = ''; });
  });

  // 移动端：点按展开二级菜单（触摸设备没有 hover）
  if (window.matchMedia('(hover: none)').matches) {
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
