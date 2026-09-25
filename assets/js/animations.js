/**
 * GSAP / ScrollTrigger animations — OneFin-style scroll-driven motion
 */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

function waitForGsap() {
  return new Promise((resolve) => {
    if (window.gsap && window.ScrollTrigger) {
      resolve();
      return;
    }
    const t = setInterval(() => {
      if (window.gsap && window.ScrollTrigger) {
        clearInterval(t);
        resolve();
      }
    }, 30);
  });
}

function isVisible(el) {
  return !!el && getComputedStyle(el).display !== "none" && el.getClientRects().length > 0;
}

function setOrbitOrigins(card, icons) {
  const c = card.getBoundingClientRect();
  const cx = c.left + c.width / 2;
  const cy = c.top + c.height / 2;
  icons.forEach((el) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--from-x", `${cx - (r.left + r.width / 2)}px`);
    el.style.setProperty("--from-y", `${cy - (r.top + r.height / 2)}px`);
  });
}

function waitHeroAssets(imgs, capMs = 800) {
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const decoded = Promise.all(
    imgs.map((img) => (img.decode ? img.decode() : Promise.resolve()).catch(() => {}))
  );
  return Promise.race([
    Promise.all([fonts, decoded]),
    new Promise((resolve) => setTimeout(resolve, capMs)),
  ]);
}

function initHeroFloatObserver(hero, icons) {
  if (!hero || !icons.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    ([entry]) => {
      const on = entry?.isIntersecting;
      icons.forEach((el) => {
        if (!el.classList.contains("is-floating")) return;
        const float = el.querySelector(".hero-float__float");
        if (float) float.style.animationPlayState = on ? "running" : "paused";
      });
    },
    { threshold: 0 }
  );
  io.observe(hero);
}

async function initHero(gsap) {
  const hero = document.querySelector("#hero");
  const card = document.querySelector("#hero .fx");
  const copy = document.querySelector("#hero .hero__copy");
  const rings = gsap.utils.toArray("#hero .hero__orbit-ring");
  const icons = gsap.utils.toArray("#hero .hero-float").filter(isVisible);
  const imgs = icons
    .map((el) => el.querySelector("img"))
    .filter(Boolean);

  if (!hero || !card) return;

  const finishPending = () => hero.classList.remove("hero--intro-pending");

  if (reducedMotion) {
    finishPending();
    icons.forEach((el) => {
      el.classList.add("is-floating");
      const float = el.querySelector(".hero-float__float");
      if (float) float.style.animationPlayState = "paused";
    });
    if (copy) gsap.set(copy, { clearProps: "all" });
    return;
  }

  await waitHeroAssets(imgs);
  setOrbitOrigins(card, icons);

  const mobile = window.matchMedia("(max-width: 810px)").matches;
  const durScale = mobile ? 0.8 : 1;
  const iconEase = mobile ? "back.out(1.1)" : "back.out(1.4)";

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

  tl.from(card, {
    autoAlpha: 0,
    scale: 0.94,
    y: 16,
    duration: 0.5 * durScale,
  });

  if (rings.length) {
    tl.from(
      rings,
      {
        autoAlpha: 0,
        scale: 0.6,
        duration: 0.8 * durScale,
        stagger: 0.08,
      },
      0.2 * durScale
    );
  }

  icons.forEach((icon, i) => {
    tl.from(
      icon,
      {
        x: () => parseFloat(icon.style.getPropertyValue("--from-x")) || 0,
        y: () => parseFloat(icon.style.getPropertyValue("--from-y")) || 0,
        scale: 0.35,
        autoAlpha: 0,
        duration: 0.9 * durScale,
        ease: iconEase,
        onComplete: () => icon.classList.add("is-floating"),
      },
      0.35 * durScale + i * 0.07
    );
  });

  // from() has applied start states — safe to drop the CSS pending cloak
  finishPending();

  if (copy) {
    gsap.from(copy, { y: 20, opacity: 0, duration: 0.8, delay: 0.15, ease: "power3.out" });
  }

  initHeroFloatObserver(hero, icons);
}

function initFloatLoops() {
  /* Float loops start from the hero intro onComplete */
}

function initProof(gsap) {
  const section = document.querySelector("#proof");
  const ticker = document.querySelector("[data-proof-ticker]");
  const cards = gsap.utils.toArray("[data-proof-card]");
  if (!section || !ticker) return;

  if (reducedMotion || window.matchMedia("(max-width: 809px)").matches) {
    cards.forEach((c) => c.classList.add("is-active"));
    return;
  }

  // Duplicate text for seamless scrub
  const base = ticker.textContent.trim();
  ticker.textContent = `${base} ${base}`;

  const sync = (progress) => {
    const x = gsap.utils.interpolate(0, -50, progress);
    gsap.set(ticker, { xPercent: x, yPercent: -50 });
    const idx = Math.min(cards.length - 1, Math.floor(progress * cards.length));
    cards.forEach((c, i) => c.classList.toggle("is-active", i === idx));
  };

  // Start at the beginning of "Trusted by millions"
  sync(0);

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => sync(self.progress),
    onRefresh: (self) => sync(self.progress),
  });
}

function initTestimonials(gsap) {
  const section = document.querySelector("#testimonials");
  const stage = section?.querySelector(".t-stage");
  const cards = gsap.utils.toArray("#testimonials [data-testimonial-card]");
  if (!section || !stage || !cards.length) return;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 1025px) and (prefers-reduced-motion: no-preference)", () => {
    const from = [
      [".t-card--award", { x: "-60vw", y: "-8vh", rotation: -16 }, 1],
      [".t-card--milestone", { x: "60vw", y: "-8vh", rotation: 16 }, 1],
      [".t-card--partner", { x: "-60vw", y: "8vh", rotation: -12 }, 2],
      [".t-card--community", { x: "60vw", y: "8vh", rotation: 12 }, 2],
      [".t-card--video", { y: "50vh", scale: 0.9 }, 3],
    ];

    // Hidden until scroll intro plays
    from.forEach(([sel, vars, z]) => {
      const el = section.querySelector(sel);
      if (!el) return;
      gsap.set(el, { ...vars, autoAlpha: 0, zIndex: z });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 70%",
        toggleActions: "play none none none",
      },
    });

    from.forEach(([sel, , z], i) => {
      const el = section.querySelector(sel);
      if (!el) return;
      tl.to(
        el,
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 1.1,
          ease: "power3.out",
          onStart: () => gsap.set(el, { zIndex: 5 }),
          onComplete: () => gsap.set(el, { zIndex: z, clearProps: "transform" }),
        },
        i * 0.18
      );
    });

    const pin = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=100%",
      pin: stage,
      pinSpacing: true,
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      pin.kill();
      gsap.set(cards, { clearProps: "opacity,visibility,transform,zIndex" });
    };
  });

  mm.add("(max-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
    gsap.set(cards, { autoAlpha: 0, y: 32 });
    gsap.to(cards, {
      y: 0,
      autoAlpha: 1,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%",
        toggleActions: "play none none none",
      },
    });
  });
}

function initReveals(gsap) {
  if (reducedMotion) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    return;
  }
  gsap.utils.toArray(".reveal").forEach((el) => {
    gsap.fromTo(
      el,
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        onComplete: () => el.classList.add("is-visible"),
      }
    );
  });
}

function initFooter(gsap) {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;

  const mark = footer.querySelector(".footer-wordmark");
  const cards = footer.querySelectorAll(".footer-card");
  const bottom = footer.querySelector(".footer-bottom");
  const topBtn = footer.querySelector(".footer-top");

  if (reducedMotion) {
    footer.classList.add("is-inview");
    return;
  }

  gsap.set(mark, { y: 40, opacity: 0 });
  gsap.set(cards, { y: 24, opacity: 0 });
  gsap.set(bottom, { y: 24, opacity: 0 });
  if (topBtn) gsap.set(topBtn, { y: 12, opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: footer,
      start: "top 75%",
      toggleActions: "play none none none",
      onEnter: () => footer.classList.add("is-inview"),
    },
  });

  tl.to(mark, { y: 0, opacity: 0.5, duration: 0.8, ease: "power3.out" })
    .to(cards, { y: 0, opacity: 1, duration: 0.55, stagger: 0.1, ease: "power3.out" }, "-=0.35")
    .to(bottom, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out" }, "-=0.35");

  if (topBtn) {
    tl.to(topBtn, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, "-=0.45");
  }
}

ready(async () => {
  await waitForGsap();
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  initHero(gsap);
  initFloatLoops();
  initProof(gsap);
  initTestimonials(gsap);
  initReveals(gsap);
  initFooter(gsap);

  // Recalculate after late layout (fonts, async map SVG, images)
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  requestAnimationFrame(() => ScrollTrigger.refresh());
});
