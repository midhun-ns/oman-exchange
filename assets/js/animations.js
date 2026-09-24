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

function positionOrbitIcons() {
  const orbit = document.querySelector("[data-orbit]");
  if (!orbit) return;
  const icons = [...orbit.querySelectorAll(".orbit-icon")];
  const n = icons.length;
  const radius = Math.min(orbit.clientWidth, orbit.clientHeight) * 0.38;
  icons.forEach((el, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    el.style.transform = `translate(${x}px, ${y}px)`;
  });
}

function initFloatLoops(gsap) {
  if (reducedMotion) return;
  gsap.utils.toArray("[data-float-card], .orbit-icon").forEach((el, i) => {
    gsap.to(el, {
      y: i % 2 === 0 ? 8 : -8,
      duration: 3 + (i % 3),
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: i * 0.15,
    });
  });
}

function initHero(gsap) {
  const phone = document.querySelector("[data-hero-phone]");
  if (!phone || reducedMotion) {
    phone?.style.setProperty("opacity", "1");
    return;
  }
  gsap.from(phone, { y: 48, opacity: 0, duration: 1, ease: "power3.out" });
  gsap.from("[data-float-card]", {
    y: 24,
    opacity: 0,
    duration: 0.9,
    stagger: 0.12,
    delay: 0.2,
    ease: "power3.out",
  });

  ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      const cards = document.querySelectorAll("[data-float-card]");
      if (cards[0]) gsap.set(cards[0], { x: -40 * self.progress });
      if (cards[1]) gsap.set(cards[1], { x: 40 * self.progress });
    },
  });
}

function initStatement(gsap) {
  const section = document.querySelector("#about");
  const words = gsap.utils.toArray("#about .word");
  if (!section || !words.length) return;

  if (reducedMotion || window.matchMedia("(max-width: 809px)").matches) {
    words.forEach((w) => w.classList.add("is-active"));
    return;
  }

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      const count = Math.floor(self.progress * words.length);
      words.forEach((w, i) => w.classList.toggle("is-active", i <= count));
    },
  });
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

  // Duplicate text for wide ticker
  ticker.textContent = `${ticker.textContent} ${ticker.textContent}`;

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      const x = gsap.utils.interpolate(20, -60, self.progress);
      gsap.set(ticker, { xPercent: x });
      const idx = Math.min(cards.length - 1, Math.floor(self.progress * cards.length));
      cards.forEach((c, i) => c.classList.toggle("is-active", i === idx));
    },
  });
}

function initFeatureCarousel() {
  const wrap = document.querySelector("[data-feature-carousel]");
  if (!wrap) return;
  const copies = [...wrap.querySelectorAll("[data-slide-copy]")];
  const pagers = [...wrap.querySelectorAll("[data-pager]")];

  const setSlide = (index) => {
    copies.forEach((el, i) => el.classList.toggle("is-active", i === index));
    pagers.forEach((btn, i) => btn.setAttribute("aria-current", String(i === index)));
  };

  pagers.forEach((btn) => {
    btn.addEventListener("click", () => setSlide(Number(btn.dataset.pager)));
  });

  if (reducedMotion || window.matchMedia("(max-width: 809px)").matches) {
    setSlide(0);
    return;
  }

  ScrollTrigger.create({
    trigger: wrap,
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      const idx = Math.min(copies.length - 1, Math.floor(self.progress * copies.length));
      setSlide(idx);
    },
  });
}

function initTestimonials(gsap) {
  const section = document.querySelector("#testimonials");
  const cards = gsap.utils.toArray("[data-testimonial-card]");
  if (!section || !cards.length) return;

  if (reducedMotion || window.matchMedia("(max-width: 809px)").matches) {
    gsap.set(cards, { clearProps: "all" });
    return;
  }

  gsap.set(cards, { opacity: 0, scale: 0.85 });

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate: (self) => {
      cards.forEach((card, i) => {
        const start = i / cards.length;
        const local = gsap.utils.clamp(0, 1, (self.progress - start) / (1 / cards.length));
        gsap.set(card, { opacity: local, scale: 0.85 + 0.15 * local });
      });
    },
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
  positionOrbitIcons();
  window.addEventListener("resize", positionOrbitIcons);

  await waitForGsap();
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  initHero(gsap);
  initFloatLoops(gsap);
  initStatement(gsap);
  initProof(gsap);
  initFeatureCarousel();
  initTestimonials(gsap);
  initReveals(gsap);
  initFooter(gsap);
});
