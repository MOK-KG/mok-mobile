import { layoutGraph } from './layout';

const node = (id: string) => ({ id, kind: 'article' as const, title: id, degree: 1 });

it('keeps every node inside the box and the focus in the centre', () => {
  const data = {
    nodes: ['a', 'b', 'c', 'd'].map(node),
    links: [
      { source: 'a', target: 'b', kind: 'link' as const },
      { source: 'a', target: 'c', kind: 'link' as const },
    ],
  };
  const pos = layoutGraph(data, 300, 200, 'a');
  expect(pos.get('a')).toEqual({ x: 150, y: 100 });
  for (const p of pos.values()) {
    expect(p.x).toBeGreaterThanOrEqual(18);
    expect(p.x).toBeLessThanOrEqual(282);
    expect(p.y).toBeGreaterThanOrEqual(18);
    expect(p.y).toBeLessThanOrEqual(182);
  }
  const dist = (x: string, y: string) => {
    const p = pos.get(x);
    const q = pos.get(y);
    return p && q ? Math.hypot(p.x - q.x, p.y - q.y) : 0;
  };
  expect(dist('a', 'b')).toBeLessThan(dist('b', 'd') + 1);
});

it('handles an empty graph and a single node', () => {
  expect(layoutGraph({ nodes: [], links: [] }, 100, 100).size).toBe(0);
  expect(layoutGraph({ nodes: [node('x')], links: [] }, 100, 80).get('x')).toEqual({
    x: 50,
    y: 40,
  });
});
