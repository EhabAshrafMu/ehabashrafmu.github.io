(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: border on scroll, mobile menu, active link ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".nav-toggle");
  const navList = document.getElementById("nav-list");
  toggle.addEventListener("click", () => {
    const open = navList.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });
  navList.addEventListener("click", (e) => {
    if (e.target.closest("a") && navList.classList.contains("open")) {
      navList.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    }
  });

  const navLinks = [...document.querySelectorAll('.nav-list a[href^="#"]')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Role rotator ---------- */
  const rotator = document.querySelector(".rotator");
  if (rotator && !reduceMotion) {
    const words = rotator.dataset.words.split("|");
    let i = 0;
    setInterval(() => {
      rotator.classList.add("out");
      setTimeout(() => {
        i = (i + 1) % words.length;
        rotator.textContent = words[i];
        rotator.classList.remove("out");
      }, 250);
    }, 2600);
  }

  /* ---------- Copy validation numbers ---------- */
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const label = btn.querySelector("span");
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        label.textContent = "Copied";
        btn.classList.add("done");
      } catch {
        label.textContent = "Select and copy";
      }
      setTimeout(() => { label.textContent = "Copy number"; btn.classList.remove("done"); }, 2000);
    });
  });

  /* ---------- Skill checker ----------
     Each chip lists the words a job description might use for it (data-m).
     Matching is whole-word and case-insensitive, all on the page. */
  const query = document.getElementById("skill-query");
  if (query) {
    const matrix = document.querySelector(".skill-matrix");
    const result = document.getElementById("skill-result");
    const clearBtn = document.querySelector(".skill-clear");
    const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[\\s-]+");
    const chips = [...matrix.querySelectorAll(".chip")].map((el) => ({
      el,
      row: el.closest(".skill-row"),
      name: el.childNodes[0].textContent.trim(),
      evidence: el.tagName === "A",
      note: el.dataset.note || "",
      re: new RegExp("(^|[^a-z0-9])(" + el.dataset.m.split("|").map(esc).join("|") + ")(?=$|[^a-z0-9])", "i"),
    }));

    const run = () => {
      const text = query.value.trim();
      clearBtn.hidden = !text;
      matrix.querySelectorAll(".hit, .has-hit").forEach((n) => n.classList.remove("hit", "has-hit"));
      if (!text) { matrix.classList.remove("filtering"); result.textContent = ""; return; }

      const hits = chips.filter((c) => c.re.test(text));
      hits.forEach((c) => { c.el.classList.add("hit"); c.row.classList.add("has-hit"); });
      matrix.classList.add("filtering");

      if (!hits.length) {
        result.textContent = "None of these tools match yet. If your stack uses something close to what's listed, email me and I'll tell you how my experience maps to it.";
        return;
      }
      const shown = hits.filter((c) => c.evidence).length;
      const notes = hits.filter((c) => c.note).map((c) => c.note);
      result.innerHTML = "";
      const strong = document.createElement("strong");
      strong.textContent = `${hits.length} ${hits.length === 1 ? "match" : "matches"}: `;
      result.append(strong, hits.map((c) => c.name).join(", ") + ".");
      if (shown) {
        result.append(hits.length === 1 ? " It's used in a project above."
          : shown === hits.length ? " All of them are used in the projects above."
          : ` ${shown} of them ${shown === 1 ? "is" : "are"} used in the projects above.`);
      }
      notes.forEach((n) => result.append(" " + n + "."));
    };

    let t;
    query.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 150); });
    clearBtn.addEventListener("click", () => { query.value = ""; run(); query.focus(); });
  }

  /* ---------- Blueprint tracer ----------
     Each <li> in .flow-steps lists the edges a packet travels (data-hops,
     "-id" means travel the edge backwards) and the nodes to light up. */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  class Tracer {
    constructor(project) {
      this.sheet = project.querySelector(".sheet");
      this.svg = project.querySelector(".drawing");
      this.packet = this.svg.querySelector(".packet");
      this.btn = project.querySelector(".trace-btn");
      this.btnLabel = this.btn.querySelector("span");
      this.btnIcon = this.btn.querySelector("use");
      this.steps = [...project.querySelectorAll(".flow-steps li")];
      this.run = 0;

      this.btn.addEventListener("click", () => (this.playing ? this.stop() : this.playAll()));
      this.steps.forEach((li, idx) => {
        li.tabIndex = 0;
        li.setAttribute("role", "button");
        li.setAttribute("aria-label", `Show step ${idx + 1} on the drawing`);
        const go = () => this.playOne(idx);
        li.addEventListener("click", go);
        li.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
        });
      });
    }

    get playing() { return this.btn.getAttribute("aria-pressed") === "true"; }

    setButton(playing, label) {
      this.btn.setAttribute("aria-pressed", String(playing));
      this.btnIcon.setAttribute("href", playing ? "#i-pause" : "#i-play");
      this.btnLabel.textContent = label;
    }

    clear() {
      this.svg.querySelectorAll(".lit").forEach((el) => el.classList.remove("lit"));
      this.steps.forEach((li) => li.classList.remove("current"));
      this.packet.classList.remove("on");
    }

    reset() {
      this.clear();
      this.sheet.classList.remove("tracing");
    }

    stop() {
      this.run++;
      this.reset();
      this.setButton(false, "Trace the flow");
    }

    async playAll() {
      const token = ++this.run;
      this.setButton(true, "Stop");
      for (let i = 0; i < this.steps.length; i++) {
        if (token !== this.run) return;
        await this.showStep(i, token);
        await sleep(reduceMotion ? 1800 : 650);
      }
      if (token !== this.run) return;
      await sleep(600);
      if (token !== this.run) return;
      this.reset();
      this.setButton(false, "Trace again");
    }

    async playOne(idx) {
      const token = ++this.run;
      this.setButton(false, "Trace the flow");
      await this.showStep(idx, token);
    }

    async showStep(idx, token) {
      this.clear();
      this.sheet.classList.add("tracing");
      const li = this.steps[idx];
      li.classList.add("current");
      (li.dataset.nodes || "").split(",").filter(Boolean).forEach((id) => {
        const n = this.svg.getElementById(id);
        if (n) n.classList.add("lit");
      });
      const hops = (li.dataset.hops || "").split(",").filter(Boolean);
      for (const hop of hops) {
        if (token !== this.run) return;
        const reverse = hop.startsWith("-");
        const path = this.svg.getElementById(reverse ? hop.slice(1) : hop);
        if (!path) continue;
        path.classList.add("lit");
        if (!reduceMotion) await this.travel(path, reverse, token);
      }
      this.packet.classList.remove("on");
    }

    travel(path, reverse, token) {
      const len = path.getTotalLength();
      const duration = Math.max(380, len * 2.6);
      this.packet.classList.add("on");
      return new Promise((resolve) => {
        const start = performance.now();
        const frame = (now) => {
          if (token !== this.run) return resolve();
          let t = Math.min(1, (now - start) / duration);
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const p = path.getPointAtLength((reverse ? 1 - eased : eased) * len);
          this.packet.setAttribute("cx", p.x);
          this.packet.setAttribute("cy", p.y);
          if (t < 1) requestAnimationFrame(frame); else resolve();
        };
        requestAnimationFrame(frame);
      });
    }
  }

  const tracers = [...document.querySelectorAll(".project")].map((p) => new Tracer(p));

  // One orchestrated moment: the first drawing traces itself once when it comes into view.
  if (!reduceMotion && tracers[0] && "IntersectionObserver" in window) {
    const first = tracers[0];
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        if (!first.playing && first.run === 0) first.playAll();
      }
    }, { threshold: 0.6 });
    io.observe(first.sheet);
  }
})();
