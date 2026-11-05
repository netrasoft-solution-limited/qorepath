import { useEffect, useRef } from 'react';

// Background for the sign-in pages: a living "nova" scene.
//  - drifting aurora light, and slow rays fanning out from behind the form
//  - a constellation that gently follows the cursor and links up to it
//  - the odd shooting star
//  - the glowing rim of a planet along the bottom edge
// Calms down to a still frame for people who prefer reduced motion, and pauses in background tabs.

type Star = { x: number; y: number; z: number; vx: number; vy: number; r: number; hot: boolean; phase: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number };

function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1;
    let stars: Star[] = [];
    const meteors: Meteor[] = [];
    const mouse = { x: -9999, y: -9999, tx: 0, ty: 0, px: 0, py: 0 };
    let nextMeteor = performance.now() + 2500;
    let frame = 0;

    const seed = () => {
      const count = Math.round(Math.min(110, Math.max(40, (w * h) / 14000)));
      stars = Array.from({ length: count }, () => {
        const z = 0.3 + Math.random() * 0.7; // depth: nearer stars are bigger, faster, move more with the cursor
        return {
          x: Math.random() * w, y: Math.random() * h, z,
          vx: (Math.random() - 0.5) * 0.12 * z, vy: (Math.random() - 0.5) * 0.12 * z,
          r: 0.6 + z * 1.4, hot: Math.random() < 0.08, phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // ease the parallax offset towards the cursor
      mouse.px += (mouse.tx - mouse.px) * 0.04;
      mouse.py += (mouse.ty - mouse.py) * 0.04;
      const link = Math.min(150, w / 7);

      const pos = stars.map((s) => {
        if (!still) {
          s.x += s.vx; s.y += s.vy;
          if (s.x < -20) s.x = w + 20; else if (s.x > w + 20) s.x = -20;
          if (s.y < -20) s.y = h + 20; else if (s.y > h + 20) s.y = -20;
        }
        return { s, x: s.x + mouse.px * s.z * 26, y: s.y + mouse.py * s.z * 26 };
      });

      // lines between neighbours
      ctx.lineWidth = 0.6;
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const a = pos[i], b = pos[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > link) continue;
          ctx.strokeStyle = `rgba(140,203,255,${(1 - d / link) * 0.16 * Math.min(a.s.z, b.s.z)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      // the cursor joins the constellation
      for (const p of pos) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d > link * 1.4) continue;
        ctx.strokeStyle = `rgba(255,176,32,${(1 - d / (link * 1.4)) * 0.35})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      // the stars themselves, twinkling; a few burn orange
      for (const p of pos) {
        const tw = still ? 0.8 : 0.55 + 0.45 * Math.sin(t / 900 + p.s.phase);
        if (p.s.hot) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s.r * 6);
          g.addColorStop(0, `rgba(255,176,32,${0.55 * tw})`);
          g.addColorStop(1, 'rgba(255,106,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s.r * 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = p.s.hot ? `rgba(255,214,150,${tw})` : `rgba(220,236,255,${tw * (0.4 + p.s.z * 0.6)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s.r, 0, Math.PI * 2); ctx.fill();
      }

      // shooting stars
      if (!still && t > nextMeteor) {
        const fromLeft = Math.random() < 0.5;
        meteors.push({
          x: fromLeft ? Math.random() * w * 0.5 : w * 0.5 + Math.random() * w * 0.5,
          y: Math.random() * h * 0.35,
          vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 4), vy: 3 + Math.random() * 2, life: 1,
        });
        nextMeteor = t + 3500 + Math.random() * 5000;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx; m.y += m.vy; m.life -= 0.012;
        if (m.life <= 0) { meteors.splice(i, 1); continue; }
        const tail = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14);
        tail.addColorStop(0, `rgba(255,255,255,${m.life})`);
        tail.addColorStop(1, 'rgba(140,203,255,0)');
        ctx.strokeStyle = tail; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 14, m.y - m.vy * 14); ctx.stroke();
      }
    };

    const loop = (t: number) => {
      draw(t);
      frame = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.tx = e.clientX / w - 0.5; mouse.ty = e.clientY / h - 0.5;
    };
    const onLeave = () => { mouse.x = mouse.y = -9999; mouse.tx = mouse.ty = 0; };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !still) frame = requestAnimationFrame(loop);
    };
    const onResize = () => { resize(); if (still) draw(0); };

    resize();
    if (still) draw(0); else frame = requestAnimationFrame(loop);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Faded out behind the form so the fields stay calm and readable.
  return (
    <canvas
      ref={ref}
      className="absolute inset-0"
      style={{
        maskImage: 'radial-gradient(ellipse 340px 420px at 50% 46%, transparent 35%, black 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 340px 420px at 50% 46%, transparent 35%, black 100%)',
      }}
    />
  );
}

export function AuthBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* aurora */}
      <div className="nn-aurora absolute -left-[15%] -top-[25%] h-[70vh] w-[70vw] rounded-full bg-[#1F5BFF]/30 blur-[140px]" />
      <div className="nn-aurora absolute -right-[20%] top-[5%] h-[60vh] w-[55vw] rounded-full bg-[#7B3FE4]/20 blur-[150px]" style={{ animationDelay: '-9s', animationDuration: '28s' }} />
      <div className="nn-aurora absolute left-[25%] top-[45%] h-[45vh] w-[50vw] rounded-full bg-[#FF6A00]/[0.10] blur-[150px]" style={{ animationDelay: '-4s', animationDuration: '34s' }} />

      {/* nova rays fanning out from behind the form */}
      <div className="absolute left-1/2 top-[40%] h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2"
        style={{
          maskImage: 'radial-gradient(circle, transparent 7%, black 16%, rgba(0,0,0,.45) 30%, transparent 55%)',
          WebkitMaskImage: 'radial-gradient(circle, transparent 7%, black 16%, rgba(0,0,0,.45) 30%, transparent 55%)',
        }}
      >
        <div className="nn-spin h-full w-full opacity-[0.18]"
          style={{
            ['--nn-dur' as any]: '240s',
            background: 'repeating-conic-gradient(from 0deg, rgba(140,203,255,.55) 0deg 1.2deg, transparent 1.2deg 9deg, rgba(255,176,32,.35) 9deg 9.6deg, transparent 9.6deg 18deg)',
          }}
        />
      </div>

      <Constellation />

      {/* the rim of a planet rising along the bottom */}
      <div className="absolute left-1/2 top-[calc(100%-110px)] h-[2400px] w-[2400px] -translate-x-1/2 rounded-full bg-[#040D29]"
        style={{ boxShadow: '0 -2px 0 rgba(140,203,255,.35), 0 -18px 60px -10px rgba(31,91,255,.55), 0 -50px 140px -20px rgba(255,106,0,.25), inset 0 30px 80px -30px rgba(140,203,255,.35)' }}
      />

      {/* soft vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(3,9,30,.65) 100%)' }} />
    </div>
  );
}
