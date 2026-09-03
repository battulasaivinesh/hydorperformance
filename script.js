/* ============ Hydor Performance ============ */

// ---------- scroll reveal ----------
const observer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal, .hub").forEach((el) => observer.observe(el));

// ---------- nav ----------
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const burger = document.getElementById("burger");
const links = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  burger.classList.toggle("open", open);
});
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("open");
    burger.classList.remove("open");
  })
);

// ---------- footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- calm water surface, reacts to mouse ----------
function waterCanvas(canvas, opts = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, t = 0, raf = null;

  const lines = opts.lines || 6;
  const baseAlpha = opts.alpha || 0.16;

  // mouse state: target = real cursor, pos = eased follower
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, energy: 0 };

  canvas.parentElement.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = e.clientX - r.left;
    mouse.ty = e.clientY - r.top;
    mouse.energy = Math.min(mouse.energy + 0.06, 1);
  });
  canvas.parentElement.addEventListener("pointerleave", () => {
    mouse.tx = -9999;
    mouse.ty = -9999;
  });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // ease follower toward cursor; decay energy when idle
    if (mouse.tx > -9000) {
      if (mouse.x < -9000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
    }
    mouse.energy *= 0.985;

    const influenceR = Math.max(w, h) * 0.22;

    for (let i = 0; i < lines; i++) {
      const yBase = h * (0.22 + (i / (lines - 1)) * 0.6);
      const amp = (12 + i * 6) * (1 + 0.25 * Math.sin(t * 0.3 + i)); // gentle breathing
      const phase = t * (0.45 + i * 0.07) + i * 2.1; // visible but calm drift
      const freq = 0.0026 - i * 0.00022;

      ctx.beginPath();
      for (let x = 0; x <= w; x += 5) {
        let y =
          yBase +
          Math.sin(x * freq + phase) * amp +
          Math.sin(x * freq * 2.1 - phase * 0.6) * amp * 0.3;

        // mouse bend: gaussian bulge toward eased cursor
        const dx = x - mouse.x;
        const dyLine = yBase - mouse.y;
        const d2 = dx * dx + dyLine * dyLine;
        if (d2 < influenceR * influenceR) {
          const fall = Math.exp(-d2 / (influenceR * influenceR * 0.35));
          const pull = Math.sign(mouse.y - yBase) || 1;
          y += pull * fall * 46 * (0.3 + mouse.energy * 0.7);
        }
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, "rgba(61,139,253,0)");
      g.addColorStop(0.5, `rgba(90,160,255,${baseAlpha - i * 0.015})`);
      g.addColorStop(1, "rgba(61,139,253,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }

    // soft glow following the cursor
    if (mouse.x > -9000 && mouse.energy > 0.02) {
      const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, influenceR);
      glow.addColorStop(0, `rgba(61,139,253,${0.10 * mouse.energy})`);
      glow.addColorStop(1, "rgba(61,139,253,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    t += 0.016; // ~seconds; keeps motion slow and frame-rate independent enough
    if (!reduced) raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", () => { resize(); if (reduced) draw(); });
  draw();

  // pause when off-screen
  new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (e.isIntersecting) { if (!reduced && !raf) raf = requestAnimationFrame(draw); }
      else { if (raf) cancelAnimationFrame(raf); raf = null; }
    });
  }).observe(canvas);
}

waterCanvas(document.getElementById("waves"), { lines: 7, alpha: 0.15 });
waterCanvas(document.getElementById("waves2"), { lines: 4, alpha: 0.09 });
