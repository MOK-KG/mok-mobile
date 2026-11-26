import type { KnowledgeGraphData } from './api';

export type Point = { x: number; y: number };

export function layoutGraph(
  data: KnowledgeGraphData,
  width: number,
  height: number,
  focusId?: string,
): Map<string, Point> {
  const nodes = data.nodes;
  const n = nodes.length;
  const pos = new Map<string, Point>();
  if (n === 0) return pos;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n;
    pos.set(node.id, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
  });
  if (focusId && pos.has(focusId)) pos.set(focusId, { x: cx, y: cy });
  if (n === 1) {
    pos.set(nodes[0].id, { x: cx, y: cy });
    return pos;
  }
  const ids = nodes.map((node) => node.id);
  const known = new Set(ids);
  const edges = data.links.filter((l) => known.has(l.source) && known.has(l.target));
  const k = Math.sqrt((width * height) / n) * 0.75;
  const iterations = Math.max(60, Math.min(300, Math.round(30000 / n)));
  let temperature = Math.min(width, height) / 8;
  const margin = 18;
  for (let step = 0; step < iterations; step++) {
    const shift = new Map<string, Point>(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let a = 0; a < n; a++) {
      const pa = pos.get(ids[a]) as Point;
      const da = shift.get(ids[a]) as Point;
      for (let b = a + 1; b < n; b++) {
        const pb = pos.get(ids[b]) as Point;
        const db = shift.get(ids[b]) as Point;
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 0.01) {
          dx = 0.01 * ((a % 3) - 1 || 1);
          dy = 0.01;
          dist = Math.hypot(dx, dy);
        }
        const force = (k * k) / dist;
        da.x += (dx / dist) * force;
        da.y += (dy / dist) * force;
        db.x -= (dx / dist) * force;
        db.y -= (dy / dist) * force;
      }
    }
    for (const e of edges) {
      const ps = pos.get(e.source) as Point;
      const pt = pos.get(e.target) as Point;
      const dx = ps.x - pt.x;
      const dy = ps.y - pt.y;
      const dist = Math.max(Math.hypot(dx, dy), 0.01);
      const force = ((dist * dist) / k) * (e.kind === 'suggested' ? 0.4 : 1);
      const ds = shift.get(e.source) as Point;
      const dt = shift.get(e.target) as Point;
      ds.x -= (dx / dist) * force;
      ds.y -= (dy / dist) * force;
      dt.x += (dx / dist) * force;
      dt.y += (dy / dist) * force;
    }
    for (const id of ids) {
      if (id === focusId) continue;
      const p = pos.get(id) as Point;
      const d = shift.get(id) as Point;
      const len = Math.max(Math.hypot(d.x, d.y), 0.01);
      const move = Math.min(len, temperature);
      p.x = Math.min(width - margin, Math.max(margin, p.x + (d.x / len) * move));
      p.y = Math.min(height - margin, Math.max(margin, p.y + (d.y / len) * move));
    }
    temperature *= 0.97;
  }
  return pos;
}
