(() => {
  const header = document.querySelector(".site-header");
  const menu = document.querySelector(".menu-btn");
  const cursor = document.querySelector(".cursor");

  const setHeader = () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 24);
  };

  setHeader();
  window.addEventListener("scroll", setHeader, { passive: true });

  if (menu && header) {
    menu.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      menu.textContent = open ? "×" : "☰";
    });

    header.querySelectorAll(".nav-links a").forEach(a => {
      a.addEventListener("click", () => {
        header.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
        menu.textContent = "☰";
      });
    });
  }

  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add("in"));
  }

  if (cursor && window.matchMedia("(pointer:fine)").matches) {
    let x = 0, y = 0, tx = 0, ty = 0;

    window.addEventListener("pointermove", e => {
      tx = e.clientX;
      ty = e.clientY;

      const target = e.target.closest("a,button,[data-hover]");
      cursor.classList.toggle("active", !!target);
    }, { passive: true });

    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;

      cursor.style.transform = `translate(${x}px,${y}px)`;

      requestAnimationFrame(loop);
    };

    loop();
  }

  // Contact form: client-side validation followed by mailto.
  const form = document.querySelector(".contact-form");

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const fields = {
        name: form.querySelector('[name="name"]'),
        email: form.querySelector('[name="email"]'),
        subject: form.querySelector('[name="subject"]'),
        message: form.querySelector('[name="message"]')
      };

      const errors = form.querySelectorAll(".error");
      errors.forEach(x => x.textContent = "");

      let ok = true;

      if (!fields.name.value.trim()) {
        fields.name.nextElementSibling.textContent =
          "Please enter your name.";
        ok = false;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())) {
        fields.email.nextElementSibling.textContent =
          "Please enter a valid email.";
        ok = false;
      }

      if (!fields.subject.value.trim()) {
        fields.subject.nextElementSibling.textContent =
          "Please add a subject.";
        ok = false;
      }

      if (fields.message.value.trim().length < 10) {
        fields.message.nextElementSibling.textContent =
          "Message should be at least 10 characters.";
        ok = false;
      }

      if (!ok) return;

      const body =
        `${fields.message.value.trim()}\n\n— ${fields.name.value.trim()} (${fields.email.value.trim()})`;

      window.location.href =
        `mailto:k.telasari@iitg.ac.in?subject=${encodeURIComponent(fields.subject.value.trim())}&body=${encodeURIComponent(body)}`;

      const status = form.querySelector(".form-status");

      if (status) {
        status.textContent =
          "Your email app should open with this message ready to send.";
      }
    });
  }

  // Illustrative potential-flow canvas used on the home hero.
  const canvas = document.getElementById("flowField");

  if (canvas) {
    const ctx = canvas.getContext("2d");

    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mobile = window.innerWidth < 768;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let t = 0;

    const mouse = {
      x: -9999,
      y: -9999,
      tx: -9999,
      ty: -9999
    };

    const cyan =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--cyan")
        .trim() || "#37d8ff";

    const violet =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--violet")
        .trim() || "#9b7cff";

    const resize = () => {
      const r = canvas.getBoundingClientRect();

      w = r.width;
      h = r.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const N = mobile ? 170 : 480;
    const U = 1.1;

    const geo = () => ({
      cx: w * 0.58,
      cy: h * 0.50,
      R: Math.min(w, h) * 0.13
    });

    const spawn = p => {
      p.x = -10 - Math.random() * 40;
      p.y = Math.random() * h;

      p.px = p.x;
      p.py = p.y;

      p.life = 180 + Math.random() * 360;
    };

    const ps = Array.from(
      { length: N },
      () => {
        const p = {
          x: 0,
          y: 0,
          px: 0,
          py: 0,
          life: 0
        };

        spawn(p);

        return p;
      }
    );

    const vel = (x, y) => {
      const { cx, cy, R } = geo();

      const dx = x - cx;
      const dy = y - cy;

      const r2 = dx * dx + dy * dy;
      const r4 = r2 * r2 || 1;

      let u =
        U *
        (
          1 -
          (R * R * (dx * dx - dy * dy)) / r4
        );

      let v =
        -U *
        (2 * R * R * dx * dy) /
        r4;

      const mx = x - mouse.x;
      const my = y - mouse.y;

      const m2 =
        mx * mx +
        my * my +
        900;

      const G = 700;

      u += (-G * my) / m2 * 0.75;
      v += (G * mx) / m2 * 0.75;

      return [
        u,
        v,
        r2 < R * R
      ];
    };

    const staticGrid = () => {
      const { cx, cy, R } = geo();

      ctx.save();

      ctx.strokeStyle =
        "rgba(200,220,255,.06)";

      ctx.lineWidth = 1;

      for (let i = 1; i <= 6; i++) {
        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          R * (1 + i * i * 0.09),
          0,
          Math.PI * 2
        );

        ctx.stroke();
      }

      for (let a = 0; a < 32; a++) {
        const q =
          (a / 32) *
          Math.PI *
          2;

        ctx.beginPath();

        ctx.moveTo(
          cx + Math.cos(q) * R,
          cy + Math.sin(q) * R
        );

        ctx.lineTo(
          cx + Math.cos(q) * R * 4.3,
          cy + Math.sin(q) * R * 4.3
        );

        ctx.stroke();
      }

      const g =
        ctx.createRadialGradient(
          cx - R * 0.3,
          cy - R * 0.3,
          R * 0.1,
          cx,
          cy,
          R
        );

      g.addColorStop(
        0,
        "rgba(40,48,64,1)"
      );

      g.addColorStop(
        1,
        "rgba(18,22,30,1)"
      );

      ctx.fillStyle = g;

      ctx.beginPath();

      ctx.arc(
        cx,
        cy,
        R,
        0,
        Math.PI * 2
      );

      ctx.fill();

      ctx.strokeStyle = cyan;
      ctx.globalAlpha = 0.6;

      ctx.stroke();

      ctx.globalAlpha = 1;

      ctx.fillStyle = cyan;

      [
        [cx - R, cy],
        [cx + R, cy]
      ].forEach(([x, y]) => {
        ctx.beginPath();

        ctx.arc(
          x,
          y,
          2.5,
          0,
          7
        );

        ctx.fill();
      });

      ctx.font =
        "10px JetBrains Mono,monospace";

      ctx.fillStyle =
        "rgba(200,210,230,.45)";

      ctx.fillText(
        "S₁",
        cx - R - 18,
        cy - 6
      );

      ctx.fillText(
        "S₂",
        cx + R + 8,
        cy - 6
      );

      ctx.fillText(
        "R = a",
        cx - 12,
        cy + 4
      );

      ctx.restore();
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);

      if (!visible) return;

      t++;

      mouse.x +=
        (mouse.tx - mouse.x) *
        0.08;

      mouse.y +=
        (mouse.ty - mouse.y) *
        0.08;

      ctx.globalCompositeOperation =
        "destination-out";

      ctx.fillStyle =
        "rgba(0,0,0,.08)";

      ctx.fillRect(
        0,
        0,
        w,
        h
      );

      ctx.globalCompositeOperation =
        "source-over";

      ctx.lineWidth = 1.1;

      for (const p of ps) {
        const [u, v, inside] =
          vel(p.x, p.y);

        p.px = p.x;
        p.py = p.y;

        p.x += u * 1.6;
        p.y += v * 1.6;

        p.life--;

        if (
          inside ||
          p.x > w + 10 ||
          p.y < -10 ||
          p.y > h + 10 ||
          p.life <= 0
        ) {
          spawn(p);
          continue;
        }

        const s =
          Math.min(
            Math.hypot(u, v) /
              (U * 2),
            1
          );

        ctx.strokeStyle =
          s > 0.55
            ? cyan
            : violet;

        ctx.globalAlpha =
          0.22 + s * 0.55;

        ctx.beginPath();

        ctx.moveTo(
          p.px,
          p.py
        );

        ctx.lineTo(
          p.x,
          p.y
        );

        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      if (t % 2 === 0) {
        staticGrid();
      }
    };

    const onMove = e => {
      const r =
        canvas.getBoundingClientRect();

      mouse.tx =
        e.clientX - r.left;

      mouse.ty =
        e.clientY - r.top;
    };

    const onLeave = () => {
      mouse.tx = -9999;
      mouse.ty = -9999;
    };

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([e]) =>
              visible =
                e.isIntersecting
          )
        : null;

    if (io) {
      io.observe(canvas);
    }

    window.addEventListener(
      "resize",
      resize
    );

    if (!mobile) {
      window.addEventListener(
        "pointermove",
        onMove
      );

      canvas.addEventListener(
        "pointerleave",
        onLeave
      );
    }

    if (reduce) {
      staticGrid();
    } else {
      tick();
    }

    window.addEventListener(
      "beforeunload",
      () => cancelAnimationFrame(raf),
      { once: true }
    );
  }
})();
