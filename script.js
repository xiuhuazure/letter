/* =========================================================
   ✏️  EDIT YOUR LETTER HERE
   ---------------------------------------------------------
   - `to`        : shown on the front of the card ("For ...")
                   (you can also use a link like  index.html?to=Sam )
   - `greeting`  : first line of the letter (leave "" for "Dear <to>,")
   - `message`   : one string per paragraph
   - `signature` : how you sign off (use \n for a new line)
   ========================================================= */
const LETTER = {
  to: "You",
  greeting: "My dearest,",
  message: [
    "I wanted to make you something you could open again and again — a little card that never gets lost in a drawer.",
    "Thank you for every laugh, every quiet moment, and every ordinary day you somehow make feel special. You make the world softer just by being in it.",
    "However far apart or close together we are, I hope you always know how much you mean to me. This is just a small reminder: you are loved, completely.",
  ],
  signature: "Forever yours,\n— Me",
};

/* ========================================================= */

(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const body = document.body;
  const card = $("#card");
  const cardInside = $(".card-inside");
  const coverBack = $(".cover-back");
  const glass = $("#glass");
  const beam = $(".beam");
  const heartsLayer = $(".hearts");
  const messageEl = $("#message");
  const signatureEl = $("#signature");
  const skipBtn = $("#skipBtn");
  const replayBtn = $("#replayBtn");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- personalise ---------- */
  const params = new URLSearchParams(location.search);
  const urlTo = (params.get("to") || "").trim().slice(0, 40);
  const to = urlTo || (LETTER.to || "").trim() || "You";
  $("#coverTo").textContent = `For ${to}`;
  $("#glassTitle").textContent = urlTo || !LETTER.greeting ? `Dear ${to},` : LETTER.greeting;
  $("#messageFull").textContent = LETTER.message.join(" ") + " " + LETTER.signature;
  card.setAttribute("aria-label", `Open your card${to ? ", " + to : ""}`);

  /* ---------- twinkling sky ---------- */
  (function buildSky() {
    const sky = $(".sky");
    const count = Math.round(Math.min(70, (innerWidth * innerHeight) / 18000));
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("i");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.setProperty("--s", (Math.random() * 2.2 + 1).toFixed(1) + "px");
      s.style.setProperty("--d", (Math.random() * 4 + 3).toFixed(1) + "s");
      s.style.setProperty("--delay", (Math.random() * -7).toFixed(1) + "s");
      s.style.setProperty("--o", (Math.random() * 0.6 + 0.3).toFixed(2));
      frag.appendChild(s);
    }
    sky.appendChild(frag);
  })();

  /* ---------- layout: how big the open / laid card should be ---------- */
  const PERSPECTIVE = 1600; // must match .stage perspective
  const LAID_TILT = 62;     // degrees the card leans back when laid down

  /* Project the laid card (scale s, spine centre at y = top, eye at y = eyeY)
     the same way the browser will, so it can be fitted precisely. */
  function projectLaid(w, h, s, top, eyeY) {
    const t = (LAID_TILT * Math.PI) / 180;
    const edge = (dir) => {             // dir: -1 = far (top) edge, +1 = near (bottom) edge
      const z = dir * (h / 2) * s * Math.sin(t);
      const k = PERSPECTIVE / (PERSPECTIVE - z);
      const y = top + dir * (h / 2) * s * Math.cos(t);
      return { y: eyeY + (y - eyeY) * k, half: w * s * k };
    };
    return { far: edge(-1), near: edge(1) };
  }

  function layout() {
    const W = innerWidth;
    const H = innerHeight;
    const w = card.offsetWidth;
    const h = card.offsetHeight;

    // open spread is two pages wide; keep it on screen
    const openScale = Math.min(1, (W * 0.94) / (2 * w));

    // laid flat: largest scale whose near edge fits the width and whose
    // footprint stays in the lower part of the screen, resting near the bottom
    const bottomY = H - Math.max(16, H * 0.04);
    const eyeOffset = H * 0.32; // how far above the card we "look" from
    let best = null;
    for (let s = 0.95; s >= 0.3; s -= 0.01) {
      // find the spine position that puts the near edge at bottomY
      let top = bottomY - (h / 2) * s * 0.5;
      for (let i = 0; i < 6; i++) {
        const p = projectLaid(w, h, s, top, top - eyeOffset);
        top += bottomY - p.near.y;
      }
      const p = projectLaid(w, h, s, top, top - eyeOffset);
      const fitsWidth = p.near.half <= W * 0.47;
      const fitsHeight = p.near.y - p.far.y <= H * 0.27;
      if (fitsWidth && fitsHeight) { best = { s, top, p }; break; }
    }
    if (!best) {
      const s = 0.3, top = bottomY - h * 0.1;
      best = { s, top, p: projectLaid(w, h, s, top, top - eyeOffset) };
    }

    const glassTop = Math.max(16, H * 0.035);
    const beamMin = Math.max(16, H * 0.025);
    const glassMax = Math.max(220, best.p.far.y - beamMin - glassTop);

    const root = document.documentElement.style;
    root.setProperty("--open-scale", openScale.toFixed(3));
    root.setProperty("--laid-scale", best.s.toFixed(3));
    root.setProperty("--laid-tilt", LAID_TILT + "deg");
    root.setProperty("--laid-top", best.top.toFixed(1) + "px");
    root.setProperty("--persp-y", (best.top - eyeOffset).toFixed(1) + "px");
    root.setProperty("--glass-max", glassMax.toFixed(1) + "px");
  }

  /* ---------- beam between laid card and glass ---------- */
  function spreadRect() {
    const a = cardInside.getBoundingClientRect();
    const b = coverBack.getBoundingClientRect();
    return {
      left: Math.min(a.left, b.left),
      right: Math.max(a.right, b.right),
      top: Math.min(a.top, b.top),
      bottom: Math.max(a.bottom, b.bottom),
    };
  }

  function positionBeam() {
    if (glass.hidden) return;
    const g = glass.getBoundingClientRect();
    const c = spreadRect();
    const topY = g.bottom - 6;
    const botY = c.top + 8;
    if (botY <= topY) { beam.style.height = "0px"; return; }

    // the far edge of a tilted card is narrower than its bounding box
    const inset = (c.right - c.left) * 0.09;
    const topL = g.left + g.width * 0.22, topR = g.right - g.width * 0.22;
    const botL = c.left + inset, botR = c.right - inset;
    const left = Math.min(topL, botL), right = Math.max(topR, botR);
    const width = right - left, height = botY - topY;
    const pct = (x) => (((x - left) / width) * 100).toFixed(2) + "%";

    Object.assign(beam.style, {
      left: left + "px",
      top: topY + "px",
      width: width + "px",
      height: height + "px",
      clipPath: `polygon(${pct(topL)} 0, ${pct(topR)} 0, ${pct(botR)} 100%, ${pct(botL)} 100%)`,
    });
  }

  // follow the card while it is still moving (transitions)
  let followUntil = 0;
  function followBeam(ms) {
    const start = !followUntil || performance.now() > followUntil;
    followUntil = performance.now() + ms;
    if (!start) return;
    const tick = () => {
      positionBeam();
      if (performance.now() < followUntil) requestAnimationFrame(tick);
      else followUntil = 0;
    };
    requestAnimationFrame(tick);
  }

  /* ---------- hearts ---------- */
  const HEART_PATH =
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  const COLORS = ["#ff4d6d", "#ff758f", "#ff8fa3", "#ffb3c1", "#ffd6e0", "#ffffff", "#e23a62", "#f7c873"];

  let heartTimer = null;
  let heartsLive = 0;
  const MAX_HEARTS = reduceMotion ? 10 : 70;

  function spawnHeart(burst) {
    if (heartsLive >= MAX_HEARTS || document.hidden) return;
    const r = spreadRect();
    const w = r.right - r.left;
    const x = r.left + w * (0.12 + Math.random() * 0.76);
    const y = r.top + (r.bottom - r.top) * (0.25 + Math.random() * 0.5);

    const size = Math.round((burst ? 12 : 10) + Math.random() * (burst ? 26 : 22));
    const dur = (reduceMotion ? 6 : 4.5) + Math.random() * 4;
    const rise = y + 80 + Math.random() * 60;

    const el = document.createElement("div");
    el.className = "heart";
    el.style.left = x - size / 2 + "px";
    el.style.top = y - size / 2 + "px";
    el.style.setProperty("--size", size + "px");
    el.style.setProperty("--c", COLORS[(Math.random() * COLORS.length) | 0]);
    el.style.setProperty("--o", (0.55 + Math.random() * 0.45).toFixed(2));
    el.style.setProperty("--dur", dur.toFixed(2) + "s");
    el.style.setProperty("--sway", (1.4 + Math.random() * 1.6).toFixed(2) + "s");
    el.style.setProperty("--dx", ((Math.random() - 0.5) * (burst ? 320 : 200)).toFixed(0) + "px");
    el.style.setProperty("--dy", -rise.toFixed(0) + "px");
    el.style.setProperty("--rot", ((Math.random() - 0.5) * 70).toFixed(0) + "deg");
    el.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="${HEART_PATH}"/></svg>`;

    heartsLive++;
    el.addEventListener("animationend", (e) => {
      if (e.target !== el) return;
      el.remove();
      heartsLive--;
    });
    heartsLayer.appendChild(el);
  }

  function startHearts() {
    const burst = reduceMotion ? 6 : 28;
    for (let i = 0; i < burst; i++) setTimeout(() => spawnHeart(true), i * 45);
    const started = performance.now();
    const loop = () => {
      spawnHeart(false);
      // lively at first, then a gentle, endless trickle
      const elapsed = performance.now() - started;
      const gap = reduceMotion ? 1600 : elapsed < 7000 ? 180 : 520;
      heartTimer = setTimeout(loop, gap + Math.random() * 140);
    };
    heartTimer = setTimeout(loop, 700);
  }

  function stopHearts() {
    clearTimeout(heartTimer);
    heartTimer = null;
  }

  /* ---------- typewriter ---------- */
  let typing = null; // { cancel }

  function typeMessage() {
    messageEl.textContent = "";
    signatureEl.textContent = LETTER.signature;
    signatureEl.classList.remove("show");
    skipBtn.hidden = false;
    replayBtn.hidden = true;

    const paras = LETTER.message.map((text) => {
      const p = document.createElement("p");
      messageEl.appendChild(p);
      return { p, text };
    });

    let pi = 0, ci = 0, t = null, done = false;
    const scroller = messageEl.parentElement;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      paras.forEach(({ p, text }) => { p.textContent = text; p.classList.remove("typing"); });
      signatureEl.classList.add("show");
      skipBtn.hidden = true;
      replayBtn.hidden = false;
    };

    if (reduceMotion) { finish(); return { cancel: finish }; }

    const step = () => {
      const cur = paras[pi];
      if (!cur) { finish(); scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" }); return; }
      cur.p.classList.add("typing");
      ci++;
      cur.p.textContent = cur.text.slice(0, ci);

      // keep the latest line in view while typing
      if (scroller.scrollHeight > scroller.clientHeight) scroller.scrollTop = scroller.scrollHeight;

      let delay = 26 + Math.random() * 30;
      const ch = cur.text[ci - 1];
      if (",;:—".includes(ch)) delay += 160;
      if (".!?".includes(ch)) delay += 320;

      if (ci >= cur.text.length) {
        cur.p.classList.remove("typing");
        pi++; ci = 0;
        delay = 600;
      }
      t = setTimeout(step, delay);
    };
    t = setTimeout(step, 300);
    return { cancel: finish };
  }

  /* ---------- sequence ---------- */
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, reduceMotion ? Math.min(ms, 150) : ms));
  let opened = false;

  function openCard() {
    if (opened) return;
    opened = true;
    layout();
    card.setAttribute("aria-expanded", "true");
    card.tabIndex = -1;

    body.classList.add("is-open");                  // cover swings open
    later(() => {
      body.classList.add("is-laid");                // card is laid down at the bottom
      later(startHearts, 350);                      // hearts float out from inside
    }, 1250);
    later(() => {
      glass.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        body.classList.add("is-reading");           // glass lens rises up
        followBeam(1800);
      }));
      later(() => { typing = typeMessage(); }, 900);
    }, 2700);
  }

  function closeCard() {
    timers.splice(0).forEach(clearTimeout);
    if (typing) typing.cancel();
    stopHearts();
    body.classList.remove("is-reading");
    later(() => {
      glass.hidden = true;
      body.classList.remove("is-laid");
      later(() => {
        body.classList.remove("is-open");
        card.removeAttribute("aria-expanded");
        card.tabIndex = 0;
        opened = false;
        card.focus({ preventScroll: true });
      }, 1200);
    }, 700);
  }

  card.addEventListener("click", openCard);
  skipBtn.addEventListener("click", () => {
    if (typing) typing.cancel();
    messageEl.parentElement.scrollTop = 0; // read from the beginning
  });
  replayBtn.addEventListener("click", closeCard);

  let resizeT;
  addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      layout();
      followBeam(1800);
    }, 120);
  });

  layout();
})();
