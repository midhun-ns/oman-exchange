/**
 * LuLu Exchange Oman — main behaviours
 * Nav, accordion, rate toggle, converter, modal
 */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hook for a future live FX feed. Returns null until wired. */
export async function fetchLiveRates() {
  return null;
}

/** Loads static fallback rates, then optionally merges a live feed. */
export async function getRates() {
  const live = await fetchLiveRates();
  if (live) return live;
  const res = await fetch("/assets/data/rates.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load rates (${res.status})`);
  return res.json();
}

/** Look up a transfer rate row by currency code. */
export function getRate(data, code) {
  return data?.transfer?.find((r) => r.code === code) ?? null;
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return [...root.querySelectorAll(sel)];
}

function formatRate(value) {
  return new Intl.NumberFormat("en-OM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

/* —— Nav —— */

const SITE = "https://luluexchange.com.om";

const ICONS = {
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  "arrow-left-right": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>`,
  landmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M3 22h18"/><path d="M5 18h14"/><path d="m12 2 9 5H3Z"/></svg>`,
  smartphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>`,
  "building-2": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

const CHEVRON = `<svg class="nav-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const NAV_ITEMS = [
  {
    id: "about",
    label: "About",
    type: "dropdown",
    children: [
      { title: "About Us", href: `${SITE}/about/`, icon: "building-2" },
      { title: "Our Team", href: `${SITE}/our-team/`, icon: "users" },
    ],
  },
  {
    id: "services",
    label: "Services",
    type: "mega",
    section: "#features",
    children: [
      {
        title: "Money Transfer",
        desc: "Send your money anywhere you want, with ease and efficiency.",
        href: `${SITE}/services/money-transfer/`,
        icon: "send",
      },
      {
        title: "Currency Exchange",
        desc: "Buy and exchange currency securely, at the best market rates.",
        href: `${SITE}/services/currency-exchange/`,
        icon: "arrow-left-right",
      },
      {
        title: "Import & Export of Currencies",
        desc: "Trade your foreign currency securely with our dedicated Bank Notes team.",
        href: `${SITE}/services/import-and-export/`,
        icon: "landmark",
      },
      {
        title: "Value Added Services",
        desc: "Make life simpler with our range of value added services.",
        href: `${SITE}/services/value-added-services/`,
        icon: "smartphone",
      },
    ],
  },
  {
    id: "branches",
    label: "Branch Locations",
    type: "link",
    href: "https://branches.luluexchange.com.om/",
    external: true,
  },
  {
    id: "money",
    label: "LuLu Money",
    type: "link",
    href: `${SITE}/lulu-money/`,
    external: true,
    tag: "App",
  },
  { id: "news", label: "News", type: "link", href: "#news", section: "#news" },
  {
    id: "careers",
    label: "Careers",
    type: "link",
    href: `${SITE}/careers/`,
    external: true,
  },
  {
    id: "contact",
    label: "Contact",
    type: "link",
    href: `${SITE}/contact/`,
    external: true,
    section: "#faq",
  },
];

const SECTION_TO_NAV = {
  "#benefits": "services",
  "#features": "services",
  "#rates": "services",
  "#news": "news",
  "#faq": "contact",
};

const COUNTRIES = [
  { code: "om", name: "Oman", flag: "/assets/img/flags/omr.svg", url: null, current: true },
  { code: "ae", name: "UAE", flag: "/assets/img/flags/aed.svg", url: "https://luluexchange.com/" },
  { code: "kw", name: "Kuwait", flag: "/assets/img/flags/kwd.svg", url: "https://luluexchange.com/kuwait" },
  { code: "bh", name: "Bahrain", flag: "/assets/img/flags/bhd.svg", url: "https://luluexchange.com/bahrain" },
  { code: "qa", name: "Qatar", flag: "/assets/img/flags/qar.svg", url: "https://luluexchange.com.qa/" },
  { code: "in", name: "India", flag: "/assets/img/flags/inr.svg", url: "https://luluforex.com/" },
  { code: "ph", name: "Philippines", flag: "/assets/img/flags/php.svg", url: "https://lulumoney.com.ph/" },
  { code: "hk", name: "Hong Kong", flag: "/assets/img/flags/hkd.svg", url: "https://lulumoney.com.hk/" },
  { code: "my", name: "Malaysia", flag: "/assets/img/flags/myr.svg", url: "https://lulumoney.com.my/" },
  { code: "sg", name: "Singapore", flag: "/assets/img/flags/sgd.svg", url: "https://lulumoney.com.sg/" },
];

const CHECK_ICON = `<svg class="country-picker__check" viewBox="0 0 16 16" aria-hidden="true" fill="none"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function extAttrs(external) {
  return external ? ` target="_blank" rel="noopener"` : "";
}

function renderAboutPanel(item) {
  return `<div class="nav-panel nav-panel--about" id="nav-panel-${item.id}" role="menu">
    <div class="nav-panel__list">
      ${item.children
        .map(
          (c) => `<a class="nav-panel__row" role="menuitem" href="${c.href}"${extAttrs(true)}>
        <span class="nav-mega__icon">${ICONS[c.icon]}</span>
        <span class="nav-panel__row-title">${c.title}</span>
      </a>`
        )
        .join("")}
    </div>
  </div>`;
}

function renderServicesPanel(item, rateText) {
  return `<div class="nav-panel nav-panel--services" id="nav-panel-${item.id}" role="menu">
    <div class="nav-mega">
      ${item.children
        .map(
          (c) => `<a class="nav-mega__tile" role="menuitem" href="${c.href}"${extAttrs(true)}>
        <span class="nav-mega__icon">${ICONS[c.icon]}</span>
        <span>
          <p class="nav-mega__title">${c.title}</p>
          <p class="nav-mega__desc">${c.desc}</p>
        </span>
      </a>`
        )
        .join("")}
    </div>
    <div class="nav-mega__footer">
      <span data-nav-rate>${rateText}</span>
      <a href="${SITE}/" target="_blank" rel="noopener">View all services →</a>
    </div>
  </div>`;
}

function renderDesktopNav(linksRoot, rateText) {
  const underdot = qs("[data-nav-underdot]", linksRoot);
  const indicator = qs("[data-nav-indicator]", linksRoot);
  const html = NAV_ITEMS.map((item) => {
    if (item.type === "link") {
      const tag = item.tag ? `<span class="nav-app-tag">${item.tag}</span>` : "";
      return `<div class="nav-item" data-nav-id="${item.id}">
        <a class="nav-link" href="${item.href}" data-nav-link="${item.id}"${extAttrs(item.external)}>${item.label}${tag}</a>
      </div>`;
    }
    const panel =
      item.type === "mega" ? renderServicesPanel(item, rateText) : renderAboutPanel(item);
    return `<div class="nav-item" data-nav-id="${item.id}" data-nav-drop>
      <button class="nav-drop__trigger" type="button" aria-expanded="false" aria-controls="nav-panel-${item.id}" data-nav-trigger="${item.id}">
        ${item.label}${CHEVRON}
      </button>
      ${panel}
    </div>`;
  }).join("");

  linksRoot.insertAdjacentHTML("afterbegin", html);
  if (indicator) linksRoot.appendChild(indicator);
  if (underdot) linksRoot.appendChild(underdot);
}

function renderMobileSheet(sheet, rateText) {
  const rows = NAV_ITEMS.map((item) => {
    if (item.type === "link") {
      const tag = item.tag ? `<span class="nav-app-tag">${item.tag}</span>` : "";
      return `<a class="nav-sheet__link" href="${item.href}"${extAttrs(item.external)}>${item.label}${tag}</a>`;
    }
    const subs = item.children
      .map(
        (c) => `<a class="nav-sheet__sub" href="${c.href}"${extAttrs(true)}>
        <span class="nav-mega__icon">${ICONS[c.icon]}</span>
        <span>${c.title}</span>
      </a>`
      )
      .join("");
    return `<div class="nav-sheet__acc" data-sheet-acc>
      <button class="nav-sheet__acc-btn" type="button" aria-expanded="false">
        ${item.label}${CHEVRON}
      </button>
      <div class="nav-sheet__acc-panel">${subs}</div>
    </div>`;
  }).join("");

  sheet.innerHTML = `
    <div class="nav-sheet__list">${rows}</div>
    <div class="nav-sheet__footer">
      <p class="rates-disclaimer" style="margin:0;text-align:start;" data-nav-rate>${rateText}</p>
      <a class="nav-sheet__branch" href="https://luluexchange.com.om/branch-locator/" target="_blank" rel="noopener">Locate a branch</a>
    </div>`;
}

function initNavTheme(header) {
  const darkSections = qsa('[data-nav-theme="dark"]');
  const setDark = (on) => {
    header.classList.toggle("is-on-dark", on);
    header.classList.toggle("nav--dark", on);
  };

  if (!darkSections.length || !("IntersectionObserver" in window)) {
    setDark(false);
    return;
  }

  const visible = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      setDark(visible.size > 0);
    },
    { rootMargin: "-12px 0px -85% 0px", threshold: 0 }
  );
  darkSections.forEach((el) => io.observe(el));
}

function initNavScroll(header) {
  const sentinel = qs("[data-nav-sentinel]");
  const setScrolled = (on) => header.classList.toggle("nav--scrolled", on);

  if (sentinel && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" }
    );
    io.observe(sentinel);
    setScrolled(window.scrollY >= 24);
    return;
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setScrolled(window.scrollY >= 24);
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initNavActive(linksRoot, header) {
  const underdot = qs("[data-nav-underdot]", linksRoot);
  const indicator = qs("[data-nav-indicator]", linksRoot);
  if (!underdot && !indicator) return;

  let activeId = null;

  const moveTo = (id) => {
    activeId = id;
    const el = qs(`[data-nav-id="${id}"]`, linksRoot);
    const trigger = el && (qs("[data-nav-link]", el) || qs("[data-nav-trigger]", el));
    if (!trigger) {
      underdot?.classList.remove("is-visible");
      indicator?.classList.remove("is-visible");
      return;
    }

    qsa(".nav-link, .nav-drop__trigger", linksRoot).forEach((n) => n.classList.remove("is-active"));
    trigger.classList.add("is-active");

    const rootBox = linksRoot.getBoundingClientRect();
    const box = trigger.getBoundingClientRect();
    const scrolled = header.classList.contains("nav--scrolled");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (scrolled && indicator) {
      const x = box.left - rootBox.left;
      const w = box.width;
      if (reduced) {
        indicator.style.transition = "none";
      }
      indicator.style.width = `${w}px`;
      indicator.style.transform = `translateX(${x}px)`;
      indicator.classList.add("is-visible");
      underdot?.classList.remove("is-visible");
    } else if (underdot) {
      const x = box.left - rootBox.left + box.width / 2 - 2;
      underdot.style.transform = `translateX(${x}px)`;
      underdot.classList.add("is-visible");
      indicator?.classList.remove("is-visible");
    }
  };

  const refresh = () => {
    if (activeId) moveTo(activeId);
  };

  const mo = new MutationObserver(refresh);
  mo.observe(header, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", refresh);

  if (!("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const navId = SECTION_TO_NAV[`#${visible.target.id}`];
      if (navId) moveTo(navId);
    },
    { rootMargin: "-30% 0px -50% 0px", threshold: [0.15, 0.35, 0.6] }
  );

  Object.keys(SECTION_TO_NAV).forEach((sel) => {
    const el = qs(sel);
    if (el) io.observe(el);
  });
}

function initDesktopDropdowns(linksRoot) {
  const items = qsa("[data-nav-drop]", linksRoot);
  let openTimer = null;
  let closeTimer = null;

  const closeAll = (except) => {
    items.forEach((item) => {
      if (item === except) return;
      item.classList.remove("is-open");
      qs("[data-nav-trigger]", item)?.setAttribute("aria-expanded", "false");
    });
  };

  const openItem = (item) => {
    closeAll(item);
    item.classList.add("is-open");
    qs("[data-nav-trigger]", item)?.setAttribute("aria-expanded", "true");
  };

  const closeItem = (item) => {
    item.classList.remove("is-open");
    qs("[data-nav-trigger]", item)?.setAttribute("aria-expanded", "false");
  };

  items.forEach((item) => {
    const trigger = qs("[data-nav-trigger]", item);
    const panel = qs(".nav-panel", item);
    if (!trigger || !panel) return;

    const scheduleOpen = () => {
      clearTimeout(closeTimer);
      openTimer = setTimeout(() => openItem(item), 120);
    };
    const scheduleClose = () => {
      clearTimeout(openTimer);
      closeTimer = setTimeout(() => closeItem(item), 200);
    };

    item.addEventListener("pointerenter", scheduleOpen);
    item.addEventListener("pointerleave", scheduleClose);

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      item.classList.contains("is-open") ? closeItem(item) : openItem(item);
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openItem(item);
        qs("[role='menuitem']", panel)?.focus();
      }
    });

    panel.addEventListener("keydown", (e) => {
      const menuItems = qsa("[role='menuitem']", panel);
      const i = menuItems.indexOf(document.activeElement);
      if (e.key === "Escape") {
        e.preventDefault();
        closeItem(item);
        trigger.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        menuItems[(i + 1) % menuItems.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        menuItems[(i - 1 + menuItems.length) % menuItems.length]?.focus();
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (!linksRoot.contains(e.target)) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

function initMobileSheet(header, nav, sheet) {
  const toggle = qs("[data-nav-toggle]", nav);
  if (!toggle || !sheet) return;

  const setOpen = (open) => {
    header.classList.toggle("is-sheet-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    sheet.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!header.classList.contains("is-sheet-open"));
  });

  sheet.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-sheet-acc] .nav-sheet__acc-btn");
    if (!btn) return;
    const acc = btn.closest("[data-sheet-acc]");
    const open = !acc.classList.contains("is-open");
    qsa("[data-sheet-acc]", sheet).forEach((a) => {
      a.classList.remove("is-open");
      qs(".nav-sheet__acc-btn", a)?.setAttribute("aria-expanded", "false");
    });
    if (open) {
      acc.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
    }
  });

  sheet.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-sheet-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
}

function initCountryPicker() {
  const root = qs("[data-country-picker]");
  if (!root) return;

  const trigger = qs("[data-country-trigger]", root);
  const panel = qs("[data-country-panel]", root);
  const menu = qs("[data-country-menu]", root);
  if (!trigger || !panel || !menu) return;

  menu.innerHTML = COUNTRIES.map((c) => {
    if (c.current) {
      return `<li role="option" aria-selected="true">
        <div class="country-picker__option is-current" data-country-option tabindex="0">
          <img class="country-picker__flag" src="${c.flag}" alt="" width="20" height="20" />
          <span class="country-picker__name">${c.name}</span>
          ${CHECK_ICON}
        </div>
      </li>`;
    }
    return `<li role="option" aria-selected="false">
      <a class="country-picker__option" href="${c.url}" target="_blank" rel="noopener" data-country-option>
        <img class="country-picker__flag" src="${c.flag}" alt="" width="20" height="20" />
        <span class="country-picker__name">${c.name}</span>
      </a>
    </li>`;
  }).join("");

  const options = () => qsa("[data-country-option]", menu);
  let backdrop = null;
  const isMobile = () => window.matchMedia("(max-width: 809px)").matches;

  const close = () => {
    root.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    backdrop?.remove();
    backdrop = null;
    if (!qs("[data-site-header]")?.classList.contains("is-sheet-open")) {
      document.body.style.overflow = "";
    }
  };

  const open = () => {
    root.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    if (isMobile()) {
      backdrop = document.createElement("div");
      backdrop.className = "country-picker-backdrop";
      backdrop.addEventListener("click", close);
      document.body.appendChild(backdrop);
      document.body.style.overflow = "hidden";
    }
    const first = options().find((o) => !o.classList.contains("is-current")) || options()[0];
    first?.focus?.();
  };

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    root.classList.contains("is-open") ? close() : open();
  });

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      if (!root.classList.contains("is-open")) open();
      else if (e.key === "ArrowDown") options()[0]?.focus?.();
    }
  });

  menu.addEventListener("keydown", (e) => {
    const items = options();
    const i = items.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      trigger.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus?.();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus?.();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-open")) {
      close();
      trigger.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) close();
  });
}

async function initNav() {
  const header = qs("[data-site-header]");
  const nav = qs("[data-navbar]");
  const linksRoot = qs("[data-nav-links]");
  const sheet = qs("[data-nav-sheet]");
  if (!header || !nav || !linksRoot) return;

  let rateText = "Today's rate: 1.00 OMR = 248.55 INR";
  try {
    const data = await getRates();
    const inr = getRate(data, "INR");
    if (inr) rateText = `Today's rate: 1.00 OMR = ${formatRate(inr.rate)} INR`;
  } catch {
    /* keep fallback */
  }

  renderDesktopNav(linksRoot, rateText);
  if (sheet) renderMobileSheet(sheet, rateText);

  initDesktopDropdowns(linksRoot);
  initNavActive(linksRoot, header);
  initMobileSheet(header, nav, sheet);
  initCountryPicker();
  initNavTheme(header);
  initNavScroll(header);
}

/* —— Accordion —— */

function initAccordions() {
  qsa("[data-accordion]").forEach((root) => {
    qsa("[data-accordion-item]", root).forEach((item) => {
      const trigger = qs("[data-accordion-trigger]", item);
      const panel = qs("[data-accordion-panel]", item);
      const icon = qs(".faq-item__icon", item);
      if (!trigger || !panel) return;

      trigger.addEventListener("click", () => {
        const open = item.getAttribute("data-open") === "true";
        qsa("[data-accordion-item]", root).forEach((other) => {
          other.setAttribute("data-open", "false");
          qs("[data-accordion-trigger]", other)?.setAttribute("aria-expanded", "false");
          qs("[data-accordion-panel]", other)?.setAttribute("hidden", "");
          const otherIcon = qs(".faq-item__icon", other);
          if (otherIcon) otherIcon.textContent = "+";
        });
        if (!open) {
          item.setAttribute("data-open", "true");
          trigger.setAttribute("aria-expanded", "true");
          panel.removeAttribute("hidden");
          if (icon) icon.textContent = "−";
        }
      });
    });
  });
}

/* —— Video modal —— */

function initVideoModal() {
  const modal = qs("#video-modal");
  const dialog = qs(".modal__dialog", modal || document);
  const frame = qs("[data-video-frame]", modal || document);
  const openers = qsa("[data-video-open]");
  const closer = qs("[data-modal-close]");
  if (!modal || !dialog || !frame) return;

  // TODO: replace with official YouTube testimonial URL from client
  const VIDEO_SRC = "";
  let pendingNote = null;

  const open = () => {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (VIDEO_SRC) {
      frame.hidden = false;
      frame.src = `${VIDEO_SRC}${VIDEO_SRC.includes("?") ? "&" : "?"}autoplay=1`;
      pendingNote?.remove();
      pendingNote = null;
    } else {
      frame.hidden = true;
      frame.removeAttribute("src");
      if (!pendingNote) {
        pendingNote = document.createElement("p");
        pendingNote.className = "rates-disclaimer";
        pendingNote.style.cssText = "padding:48px 24px;text-align:center;color:#fff;";
        pendingNote.textContent = "Testimonial video URL pending client confirmation.";
        dialog.appendChild(pendingNote);
      }
    }
  };

  const close = () => {
    modal.hidden = true;
    frame.src = "";
    document.body.style.overflow = "";
  };

  openers.forEach((el) => el.addEventListener("click", open));
  closer?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

/* —— Reveal fallback (if GSAP absent) —— */

function initReveal() {
  const items = qsa(".reveal");
  if (!items.length) return;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/* —— Rates + converter —— */

const WAYS_TO_SEND = [
  "LuLu Now instant credit",
  "Direct to account",
  "Cash pick-up",
  "LuLu Money app",
];

function pickTransferCards(list) {
  const order = ["INR", "PHP", "BDT"];
  return order
    .map((code) => list.find((item) => item.code === code))
    .filter(Boolean)
    .map((item, i) => ({ ...item, featured: i === 0 || item.featured }));
}

async function initRates() {
  const rateRoots = qsa("[data-rates]");
  const converters = qsa("[data-converter]");
  const heroRate = qs("[data-hero-rate]");
  const benefitRate = qs("[data-benefit-rate]");
  if (!rateRoots.length && !converters.length && !heroRate) return;

  let data;
  try {
    data = await getRates();
  } catch (err) {
    console.error(err);
    rateRoots.forEach((root) => {
      const grid = qs("[data-rates-grid]", root);
      if (grid) grid.innerHTML = `<p class="rates-disclaimer">Unable to load rates. Please try again later.</p>`;
    });
    return;
  }

  qsa("[data-rates-disclaimer]").forEach((el) => {
    el.textContent = data.disclaimer;
  });

  const inr = getRate(data, "INR");
  if (inr && heroRate) {
    heroRate.textContent = `1.00 OMR = ${formatRate(inr.rate)} INR`;
  }
  if (inr && benefitRate) {
    benefitRate.textContent = `OMR 1 = INR ${formatRate(inr.rate)}`;
  }

  const renderCards = (root, mode) => {
    const grid = qs("[data-rates-grid]", root);
    if (!grid) return;

    if (mode === "exchange") {
      const list = data.exchange.filter((item) => ["INR", "PHP", "BDT"].includes(item.code));
      grid.innerHTML = list
        .map((item, i) => {
          const featured = i === 0 ? " price-card--featured" : "";
          return `
            <article class="price-card${featured}">
              <div class="price-card__top">
                <p class="price-card__name">1 OMR → ${item.code}</p>
                <span class="tag-pill">${item.name}</span>
              </div>
              <p class="price-card__value">${formatRate(item.sell)}</p>
              <p class="price-card__unit">Sell rate · Buy ${formatRate(item.buy)}</p>
              <p class="price-card__desc">Walk-in currency exchange at any LuLu Exchange branch.</p>
              <ul class="price-card__list">
                <li>Best market rates</li>
                <li>Secure &amp; warranted</li>
                <li>Import &amp; export desk</li>
                <li>46 branches in Oman</li>
              </ul>
              <a class="btn btn--block" href="https://luluexchange.com.om/branch-locator/" target="_blank" rel="noopener">Find nearest branch</a>
            </article>
          `;
        })
        .join("");
      return;
    }

    const list = pickTransferCards(data.transfer);
    grid.innerHTML = list
      .map((item) => {
        const featured = item.featured ? " price-card--featured" : "";
        return `
          <article class="price-card${featured}">
            <div class="price-card__top">
              <p class="price-card__name">1 OMR → ${item.code}</p>
              <span class="tag-pill">${item.name}</span>
            </div>
            <p class="price-card__value">${formatRate(item.rate)}</p>
            <p class="price-card__unit">Indicative transfer rate</p>
            <p class="price-card__desc">Send via LuLu Now, direct to account, or cash pick-up.</p>
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:var(--grey-600);">Ways to send</p>
            <ul class="price-card__list">
              ${WAYS_TO_SEND.map((line) => `<li>${line}</li>`).join("")}
            </ul>
            <a class="btn btn--block" href="https://luluexchange.com.om/branch-locator/" target="_blank" rel="noopener">Find nearest branch</a>
          </article>
        `;
      })
      .join("");
  };

  rateRoots.forEach((root) => {
    let mode = root.getAttribute("data-rates-mode") || "transfer";
    renderCards(root, mode);

    qsa("[data-rate-toggle]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.getAttribute("data-rate-toggle");
        qsa("[data-rate-toggle]", root).forEach((b) =>
          b.setAttribute("aria-pressed", String(b === btn))
        );
        renderCards(root, mode);
      });
    });
  });

  converters.forEach((root) => {
    const amountInput = qs("[data-converter-amount]", root);
    const toSelect = qs("[data-converter-to]", root);
    const resultEl = qs("[data-converter-result]", root);
    const mini = qs("[data-mini-rates]", root);
    if (!amountInput || !toSelect || !resultEl) return;

    toSelect.innerHTML = data.transfer
      .map((c) => `<option value="${c.code}" data-rate="${c.rate}">${c.code} — ${c.name}</option>`)
      .join("");

    const usd = getRate(data, "USD");
    const aed = getRate(data, "AED");
    if (mini) {
      mini.innerHTML = [
        usd ? `<span>USD · ${formatRate(usd.rate)}</span>` : "",
        aed ? `<span>AED · ${formatRate(aed.rate)}</span>` : "",
      ].join("");
    }

    const update = () => {
      const amount = Number.parseFloat(String(amountInput.value).replace(/,/g, "")) || 0;
      const opt = toSelect.selectedOptions[0];
      const rate = Number(opt?.dataset.rate || 0);
      resultEl.textContent = `${formatRate(amount * rate)} ${opt?.value || ""}`;
    };

    amountInput.addEventListener("input", update);
    toSelect.addEventListener("change", update);
    update();
  });
}

function initBackToTop() {
  qsa("[data-back-to-top]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  });
}

async function initRateStrip() {
  const root = qs(".rate-strip");
  if (!root) return;

  let data;
  try {
    data = await getRates();
  } catch (err) {
    console.error(err);
    return;
  }

  const fmt = (n) =>
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const base = data.base;
  const baseEl = qs(".rate-strip__base", root);
  if (baseEl && base) {
    const flag = typeof base.flag === "string" ? base.flag : "omr.svg";
    baseEl.innerHTML = `
      <img class="rate-strip__flag" src="/assets/img/flags/${flag}" alt="" width="28" height="28">
      ${fmt(base.amount ?? 1)} <small>${base.code ?? "OMR"}</small>`;
  }

  const list = qs(".rate-strip__list", root);
  if (list) {
    list.innerHTML = (data.transfer || [])
      .map(
        (c) => `
      <li class="rate-strip__item">
        <span class="rate-strip__name">${c.name}</span>
        <span class="rate-strip__row">
          <span class="rate-strip__value">${fmt(c.rate)}</span>
          <span class="rate-strip__code">${c.code}</span>
          <img class="rate-strip__flag" src="/assets/img/flags/${c.flag}" alt="" width="28" height="28" loading="lazy">
        </span>
      </li>`
      )
      .join("");
  }

  const updatedEl = qs(".rate-strip__updated", root);
  if (updatedEl && data.updated) {
    const d = new Date(data.updated);
    updatedEl.textContent = `Updated ${d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}.`;
  }

  if (!list) return;

  const [prev, next] = qsa(".rate-strip__btn", root);
  const rtl = document.documentElement.dir === "rtl" ? -1 : 1;
  const step = () => (list.querySelector(".rate-strip__item")?.offsetWidth || 220) * 2;

  const sync = () => {
    if (prev) prev.disabled = list.scrollLeft < 4;
    if (next) next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
  };

  qsa(".rate-strip__btn", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.dir) * rtl;
      list.scrollBy({ left: step() * dir, behavior: "smooth" });
    });
  });

  list.addEventListener("scroll", sync, { passive: true });
  sync();

  const setH = () => {
    document.documentElement.style.setProperty("--rate-strip-h", `${root.offsetHeight}px`);
    const tall =
      root.offsetHeight > 320 && window.matchMedia("(max-width: 809px)").matches;
    root.classList.toggle("rate-strip--tall", tall);
  };
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(setH).observe(root);
  }
  window.addEventListener("resize", setH, { passive: true });
  setH();

  const inner = qs(".rate-strip__inner", root);
  if (inner) {
    const reveal = () => {
      root.classList.add("is-visible");
      inner.classList.add("is-visible");
    };
    if (reducedMotion || !("IntersectionObserver" in window)) {
      reveal();
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            reveal();
            io.disconnect();
          }
        },
        { threshold: 0, rootMargin: "0px 0px -10% 0px" }
      );
      io.observe(qs("#benefits") || root);
    }
  }
}

function initCtaPhone() {
  const phone = qs("[data-cta-phone]");
  if (!phone) return;
  const slides = qsa("[data-cta-slide]", phone);
  if (slides.length < 2) return;

  if (reducedMotion) {
    slides.forEach((el, i) => el.classList.toggle("is-active", i === 0));
    return;
  }

  let index = 0;
  let timer = null;

  const show = (i) => {
    slides.forEach((el, n) => el.classList.toggle("is-active", n === i));
  };

  const tick = () => {
    index = (index + 1) % slides.length;
    show(index);
  };

  const start = () => {
    if (timer) return;
    timer = window.setInterval(tick, 3500);
  };

  const stop = () => {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  };

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
      },
      { threshold: 0.25 }
    );
    io.observe(phone);
  } else {
    start();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initAccordions();
  initVideoModal();
  initReveal();
  initRates();
  initBackToTop();
  initRateStrip();
  initCtaPhone();
});
