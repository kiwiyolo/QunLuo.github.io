export function stepToward(position, target, elapsed, speed = 155) {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);
  const travel = Math.min(distance, Math.max(0, Math.min(elapsed, .05)) * speed);
  if (distance < 1) return { x: target.x, y: target.y, moving: false };
  return { x: position.x + dx / distance * travel, y: position.y + dy / distance * travel, moving: travel < distance };
}

export function insideMap(x, y) {
  const corners = [[.5937, 0], [1, .414], [.4145, 1], [0, .583]];
  let sign = 0;
  for (let i = 0; i < corners.length; i++) {
    const [ax, ay] = corners[i]; const [bx, by] = corners[(i + 1) % corners.length];
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (Math.abs(cross) < 1e-8) continue;
    if (sign && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return Number.isFinite(x) && Number.isFinite(y);
}
