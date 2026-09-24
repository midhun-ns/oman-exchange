/**
 * LuLu Exchange Oman — main behaviours
 * Nav, accordion, converter, modal
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

function parseAmount(value) {
  const n = Number.parseFloat(String(value ?? "").replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function formatAmount(value, maxDigits = 2) {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  }).format(value);
}

/* —— Hero glass converter —— */

async function initHeroConverter() {
  const root = qs("[data-hero-converter]");
  if (!root) return;

  const fromAmount = qs("[data-hero-from-amount]", root);
  const toAmount = qs("[data-hero-to-amount]", root);
  const fromFlag = qs("[data-hero-from-flag]", root);
  const toFlag = qs("[data-hero-to-flag]", root);
  const fromCodeEl = qs("[data-fx-from-code]", root);
  const toCodeEl = qs("[data-fx-to-code]", root);
  const rateFromEl = qs("[data-fx-rate-from]", root);
  const rateStrong = qs("[data-hero-fx-rate-strong]", root);
  const status = qs("[data-hero-fx-status]", root);
  const errorEl = qs("[data-hero-fx-error]", root);
  const swapBtn = qs("[data-hero-swap]", root);
  const tip = qs("#fx-tip", root);
  const fromBtn = qs("[data-fx-from-btn]", root);
  const toBtn = qs("[data-fx-to-btn]", root);
  const fromMenu = qs("[data-fx-from-menu]", root);
  const toMenu = qs("[data-fx-to-menu]", root);

  if (!fromAmount || !toAmount || !fromBtn || !toBtn || !fromMenu || !toMenu) return;

  const setStatus = (loading, message = "") => {
    root.classList.toggle("is-loading", loading);
    if (status) {
      status.hidden = !loading;
      if (loading) status.textContent = message || "Loading rates…";
    }
  };

  const setError = (msg) => {
    if (!errorEl) return;
    errorEl.hidden = !msg;
    errorEl.textContent = msg || "";
  };

  setStatus(true);

  let data;
  try {
    data = await getRates();
  } catch (err) {
    console.error(err);
    setStatus(false);
    setError("Unable to load rates. Please try again later.");
    return;
  }

  setStatus(false);
  setError("");
  if (tip && data.disclaimer) tip.textContent = data.disclaimer;

  const baseCode = data.base?.code || "OMR";
  const baseFlag = data.base?.flag || "omr.svg";
  const currencies = [
    { code: baseCode, name: "Omani Rial", rate: 1, flag: baseFlag },
    ...(data.transfer || []),
  ];
  const ratesMap = Object.fromEntries(currencies.map((c) => [c.code, Number(c.rate)]));
  const flagMap = Object.fromEntries(currencies.map((c) => [c.code, c.flag]));

  let fromCode = baseCode;
  let toCode = "INR";
  let editing = "from";

  const decimalsFor = (code) => (code === "OMR" ? 3 : 2);

  const toOmr = (amount, code) => {
    if (code === baseCode) return amount;
    const rate = ratesMap[code];
    return rate ? amount / rate : NaN;
  };

  const fromOmr = (amountOmr, code) => {
    if (code === baseCode) return amountOmr;
    const rate = ratesMap[code];
    return rate ? amountOmr * rate : NaN;
  };

  const convert = (amount, from, to) => fromOmr(toOmr(amount, from), to);

  const syncCcy = (code, flagEl, codeEl) => {
    if (flagEl) flagEl.src = `/assets/img/flags/${flagMap[code] || "omr.svg"}`;
    if (codeEl) codeEl.textContent = code;
  };

  const closeMenus = () => {
    fromMenu.hidden = true;
    toMenu.hidden = true;
    fromBtn.setAttribute("aria-expanded", "false");
    toBtn.setAttribute("aria-expanded", "false");
  };

  const fillMenu = (menu, selected) => {
    menu.innerHTML = currencies
      .map(
        (c) => `
      <li role="none">
        <button type="button" class="fx__option" role="option" data-code="${c.code}" aria-selected="${c.code === selected}">
          <img src="/assets/img/flags/${c.flag}" alt="" width="22" height="22" />
          <span>${c.code}</span>
          <span style="margin-inline-start:auto;opacity:.55;font-size:12px;">${c.name}</span>
        </button>
      </li>`
      )
      .join("");
  };

  const bindMenu = (btn, menu, getCode, setCode) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = menu.hidden;
      closeMenus();
      if (open) {
        fillMenu(menu, getCode());
        menu.hidden = false;
        btn.setAttribute("aria-expanded", "true");
      }
    });

    menu.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-code]");
      if (!opt) return;
      setCode(opt.dataset.code);
      closeMenus();
      update(editing);
    });
  };

  bindMenu(fromBtn, fromMenu, () => fromCode, (code) => {
    fromCode = code;
  });
  bindMenu(toBtn, toMenu, () => toCode, (code) => {
    toCode = code;
  });

  document.addEventListener("click", (e) => {
    if (!root.contains(e.target)) closeMenus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenus();
  });

  const update = (source = editing) => {
    syncCcy(fromCode, fromFlag, fromCodeEl);
    syncCcy(toCode, toFlag, toCodeEl);
    if (rateFromEl) rateFromEl.textContent = fromCode;

    fromAmount.setAttribute("aria-label", `Amount to send in ${fromCode}`);
    toAmount.setAttribute("aria-label", `Amount received in ${toCode}`);

    if (fromCode === toCode) {
      setError("Choose two different currencies.");
      toAmount.value = formatAmount(parseAmount(fromAmount.value), decimalsFor(toCode));
      if (rateStrong) rateStrong.textContent = `1 ${toCode}`;
      return;
    }
    setError("");

    if (source === "from") {
      const amount = parseAmount(fromAmount.value);
      const result = convert(amount, fromCode, toCode);
      toAmount.value = Number.isFinite(result)
        ? formatAmount(result, decimalsFor(toCode))
        : "—";
    } else {
      const amount = parseAmount(toAmount.value);
      const result = convert(amount, toCode, fromCode);
      fromAmount.value = Number.isFinite(result)
        ? formatAmount(result, decimalsFor(fromCode))
        : "—";
    }

    const unit = convert(1, fromCode, toCode);
    if (rateStrong) {
      rateStrong.textContent = Number.isFinite(unit)
        ? `${formatRate(unit)} ${toCode}`
        : "—";
    }
  };

  const sanitizeInput = (input) => {
    const cleaned = input.value.replace(/[^\d.]/g, "");
    if (cleaned !== input.value) input.value = cleaned;
  };

  fromAmount.addEventListener("input", () => {
    editing = "from";
    sanitizeInput(fromAmount);
    update("from");
  });
  fromAmount.addEventListener("blur", () => {
    fromAmount.value = formatAmount(parseAmount(fromAmount.value), decimalsFor(fromCode));
  });

  toAmount.addEventListener("input", () => {
    editing = "to";
    sanitizeInput(toAmount);
    update("to");
  });
  toAmount.addEventListener("blur", () => {
    toAmount.value = formatAmount(parseAmount(toAmount.value), decimalsFor(toCode));
  });

  swapBtn?.addEventListener("click", () => {
    swapBtn.classList.toggle("is-swapped");
    const prevFrom = fromCode;
    const prevTo = toCode;
    const prevFromAmt = fromAmount.value;
    const prevToAmt = toAmount.value;
    fromCode = prevTo;
    toCode = prevFrom;
    fromAmount.value = prevToAmt;
    toAmount.value = prevFromAmt;
    editing = "from";
    update("from");
  });

  fromAmount.value = "1,000";
  update("from");
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
    section: "#benefits",
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
    <nav class="nav-sheet__list" aria-label="Primary">${rows}</nav>
    <div class="nav-sheet__footer">
      <p class="nav-sheet__rate" data-nav-rate>${rateText}</p>
      <div class="nav-sheet__country" data-sheet-country></div>
      <a class="btn btn--of-primary nav-sheet__branch" href="https://luluexchange.com.om/branch-locator/" target="_blank" rel="noopener">Locate a branch</a>
    </div>`;
}

function placeCountryPicker() {
  const picker = qs("[data-country-picker]");
  const slot = qs("[data-sheet-country]");
  const actions = qs(".navbar__actions");
  const toggle = qs("[data-nav-toggle]");
  if (!picker || !actions || !toggle) return;

  if (window.matchMedia("(max-width: 1023px)").matches && slot) {
    if (picker.parentElement !== slot) slot.appendChild(picker);
  } else if (picker.parentElement !== actions) {
    actions.insertBefore(picker, toggle);
  }
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
    if (!open) {
      const picker = qs("[data-country-picker]");
      if (picker?.classList.contains("is-open")) {
        picker.classList.remove("is-open");
        qs("[data-country-trigger]", picker)?.setAttribute("aria-expanded", "false");
        qs("[data-country-panel]", picker)?.setAttribute("aria-hidden", "true");
        document.querySelector(".country-picker-backdrop")?.remove();
      }
    }
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
  const isMobile = () => window.matchMedia("(max-width: 1023px)").matches;

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
    /* Backdrop on body sits above the drawer stacking context and blocks taps.
       Skip it when the picker lives inside the nav sheet. */
    if (isMobile() && !root.closest("[data-nav-sheet]")) {
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
  placeCountryPicker();
  window.addEventListener("resize", placeCountryPicker, { passive: true });

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

  const VIDEO_SRC = "https://www.youtube-nocookie.com/embed/ZkC4ffPqOvw";
  let lastOpener = null;

  const open = (opener) => {
    lastOpener = opener || null;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    frame.hidden = false;
    frame.src = `${VIDEO_SRC}?autoplay=1`;
    closer?.focus();
  };

  const close = () => {
    modal.hidden = true;
    frame.src = "";
    document.body.style.overflow = "";
    lastOpener?.focus();
  };

  openers.forEach((el) => el.addEventListener("click", () => open(el)));
  closer?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });
}

function initTestimonialsCarousel() {
  const track = qs("[data-t-track]");
  const dotsRoot = qs("[data-t-dots]");
  if (!track || !dotsRoot) return;

  const cards = qsa("[data-testimonial-card]", track);
  if (!cards.length) return;

  dotsRoot.innerHTML = cards
    .map((_, i) => `<button type="button" aria-label="Go to card ${i + 1}"></button>`)
    .join("");
  const dots = qsa("button", dotsRoot);

  const sync = () => {
    const left = track.scrollLeft;
    let active = 0;
    let best = Infinity;
    cards.forEach((card, i) => {
      const dist = Math.abs(card.offsetLeft - left);
      if (dist < best) {
        best = dist;
        active = i;
      }
    });
    dots.forEach((d, i) => d.classList.toggle("is-active", i === active));
  };

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      cards[i]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    });
  });

  track.addEventListener("scroll", sync, { passive: true });
  sync();
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

/* —— Live rate snippets (benefits + disclaimers) —— */

async function initRates() {
  const benefitRate = qs("[data-benefit-rate]");
  const disclaimers = qsa("[data-rates-disclaimer]");
  if (!benefitRate && !disclaimers.length) return;

  let data;
  try {
    data = await getRates();
  } catch (err) {
    console.error(err);
    return;
  }

  if (data.disclaimer) {
    disclaimers.forEach((el) => {
    el.textContent = data.disclaimer;
  });
  }

  const inr = getRate(data, "INR");
  if (inr && benefitRate) {
    benefitRate.textContent = `OMR 1 = INR ${formatRate(inr.rate)}`;
  }
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

async function initPresenceMap() {
  const wrap = qs(".presence__map");
  const host = qs("[data-presence-map]", wrap || document);
  if (!wrap || !host) return;

  try {
    const res = await fetch("/assets/img/oman-branch-map.svg", { cache: "force-cache" });
    if (!res.ok) throw new Error(`Map SVG ${res.status}`);
    host.innerHTML = await res.text();
    window.ScrollTrigger?.refresh();
  } catch (err) {
    console.error(err);
    return;
  }

  const svg = qs(".oman-map", host);
  const tip = qs(".presence__tip", wrap);
  const nameEl = qs(".presence__tip-name", tip);
  const link = qs(".presence__tip-link", tip);
  if (!svg || !tip || !nameEl || !link) return;

  const landDots = qsa(".om-land circle", svg);
  landDots.forEach((dot, i) => dot.style.setProperty("--i", String(i)));

  const dots = qsa(".om-branch", svg);
  let active = null;

  const placeTip = (dot) => {
    const w = wrap.getBoundingClientRect();
    const d = dot.getBoundingClientRect();
    const rawLeft = d.left - w.left + d.width / 2;
    const top = d.top - w.top + d.height / 2;
    const tipW = tip.offsetWidth || 168;
    const half = tipW / 2;
    const margin = 8;
    const clamped = Math.min(Math.max(rawLeft, half + margin), w.width - half - margin);
    const arrowPct = 50 + ((rawLeft - clamped) / tipW) * 100;
    tip.style.setProperty("--arrow-x", `${Math.min(Math.max(arrowPct, 12), 88)}%`);
    tip.style.left = `${clamped}px`;
    tip.style.top = `${top}px`;
  };

  const show = (dot) => {
    if (!dot) return;
    active?.classList.remove("is-active");
    active = dot;
    dot.classList.add("is-active");
    nameEl.textContent = dot.dataset.name || "";
    link.href = dot.dataset.url || "#";
    tip.hidden = false;
    placeTip(dot);
  };

  dots.forEach((dot) => {
    dot.addEventListener("mouseenter", () => show(dot));
    dot.addEventListener("focus", () => show(dot));
    dot.addEventListener("click", () => show(dot));
    dot.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && dot.dataset.url) {
        window.open(dot.dataset.url, "_blank", "noopener");
      }
    });
  });

  const defaultDot =
    dots.find((d) => d.dataset.name === "Al Ghubra – Main") || dots[0];
  show(defaultDot);

  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => active && placeTip(active)).observe(wrap);
  }

  if (reducedMotion) {
    svg.classList.add("is-in");
    return;
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          svg.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(wrap);
  } else {
    svg.classList.add("is-in");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initAccordions();
  initVideoModal();
  initReveal();
  initHeroConverter();
  initRates();
  initBackToTop();
  initRateStrip();
  initCtaPhone();
  initPresenceMap();
  initTestimonialsCarousel();
});
