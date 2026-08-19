import { useEffect, useRef } from 'react';

const AuthCanvas = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let explosions = [];
    let animationFrameId;

    function resize() {
      if (!container || !canvas) return;
      const dpr = window.devicePixelRatio || 1;
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    resize();
    window.addEventListener('resize', resize);

    const handleClick = (e) => {
      const rect = container.getBoundingClientRect();
      explosions.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        radius: 0,
        life: 1,
      });
    };

    container.addEventListener('click', handleClick);

    const paths = [];
    const numPaths = 35;

    for (let i = 0; i < numPaths; i++) {
      paths.push({
        isLeft: i % 2 === 0,
        startY: (i / numPaths) * (height || 800) * 1.5 - (height || 800) * 0.2,
        particles: [
          {
            t: Math.random(),
            speed: 0.0015 + Math.random() * 0.002,
          },
        ],
      });
    }

    function getBezierPoint(t, p0, p1, p2, p3) {
      const u = 1 - t;
      return {
        x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
        y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
      };
    }

    function render() {
      if (!ctx || width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;

      explosions.forEach((exp) => {
        exp.radius += 12;
        exp.life -= 0.02;
      });
      explosions = explosions.filter((exp) => exp.life > 0);

      paths.forEach((path) => {
        const p0 = { x: path.isLeft ? -50 : width + 50, y: path.startY };
        const p1 = { x: path.isLeft ? centerX * 0.4 : width - centerX * 0.4, y: path.startY };
        const p2 = { x: path.isLeft ? centerX * 0.7 : width - centerX * 0.7, y: centerY };
        const p3 = { x: centerX, y: centerY };

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        path.particles.forEach((p) => {
          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            path.startY += (Math.random() - 0.5) * 15;
          }

          let pos = getBezierPoint(p.t, p0, p1, p2, p3);

          let dxTotal = 0;
          let dyTotal = 0;
          explosions.forEach((exp) => {
            let dx = pos.x - exp.x;
            let dy = pos.y - exp.y;
            let dist = Math.hypot(dx, dy);
            if (dist < exp.radius + 100 && dist > exp.radius - 100) {
              let force = (1 - Math.abs(dist - exp.radius) / 100) * exp.life;
              dxTotal += (dx / dist) * force * 60;
              dyTotal += (dy / dist) * force * 60;
            }
          });

          pos.x += dxTotal;
          pos.y += dyTotal;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    return () => {
      window.removeEventListener('resize', resize);
      container.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 cursor-crosshair">
      <div
        className="absolute inset-0 z-10 opacity-30"
        style={{
          background: 'radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.1) 0%, rgba(0, 0, 0, 0) 70%)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />
      {/* Mobile fade mask */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10 lg:hidden" />
    </div>
  );
};

export default AuthCanvas;
