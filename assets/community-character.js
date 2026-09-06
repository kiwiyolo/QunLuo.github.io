import { stepToward, insideMap } from './community-motion.js';

const map = document.querySelector('.city-layer');
if (map) {
  const runner = map.querySelector('.city-runner');
  const canvas = runner.querySelector('canvas');
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let sprite, config, loading = false, visible = false, frameId = 0, previous = 0, phase = 0;
  let position = { x: .51, y: .54 }, target = { ...position }, direction = 'right';
  function draw(moving = false) {
    if (!sprite || !context) return;
    const width = runner.clientWidth, height = runner.clientHeight, scale = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
      canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    }
    const frame = moving ? Math.floor(phase * config.fps) % config.frames : 0;
    const row = direction === 'left' && config.rows > 1 ? 1 : 0;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, width, height);
    const mirror = direction === 'left' && config.rows === 1;
    if (mirror) { context.translate(width, 0); context.scale(-1, 1); }
    context.drawImage(sprite, frame * config.frameWidth, row * config.frameHeight, config.frameWidth, config.frameHeight, 0, 0, width, height);
    runner.style.left = (position.x * 100) + '%'; runner.style.top = (position.y * 100) + '%';
  }
  function stop() { cancelAnimationFrame(frameId); frameId = 0; previous = 0; target = { ...position }; draw(); }
  function tick(time) {
    frameId = 0;
    if (!visible || document.hidden || reduced.matches || !sprite) { draw(); return; }
    const elapsed = previous ? (time - previous) / 1000 : 1 / 60; previous = time;
    const { width, height } = map.getBoundingClientRect();
    if (!width || !height) return;
    const current = { x: position.x * width, y: position.y * height };
    const destination = { x: target.x * width, y: target.y * height };
    const next = stepToward(current, destination, elapsed);
    if (Math.abs(destination.x - current.x) > 1) direction = destination.x < current.x ? 'left' : 'right';
    position = { x: next.x / width, y: next.y / height }; phase += Math.min(elapsed, .05);
    draw(next.moving);
    if (next.moving) frameId = requestAnimationFrame(tick); else previous = 0;
  }
  map.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || reduced.matches || !sprite) return;
    const bounds = map.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width, y = (event.clientY - bounds.top) / bounds.height;
    if (!insideMap(x, y)) { stop(); return; }
    target = { x, y };
    if (!frameId) frameId = requestAnimationFrame(tick);
  }, { passive: true });
  map.addEventListener('pointerleave', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  reduced.addEventListener('change', stop);
  new ResizeObserver(() => draw()).observe(runner);
  new IntersectionObserver(async ([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { stop(); return; }
    if (loading) return;
    loading = true;
    try {
      const response = await fetch('/assets/character/kirito-sprite.json');
      if (!response.ok) throw new Error('Character metadata unavailable');
      config = await response.json();
      const picture = new Image(); picture.src = '/assets/character/' + config.image;
      await picture.decode(); sprite = picture; draw(); runner.classList.add('is-ready');
    } catch (error) { console.warn('Community character:', error.message); loading = false; }
  }, { rootMargin: '180px' }).observe(map);
}
