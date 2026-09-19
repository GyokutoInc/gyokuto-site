const root = document.documentElement;
root.classList.add("has-js");

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const siteHeader = document.querySelector(".home-header, .site-header");
const navOriginalParent = siteNav?.parentElement || null;
const navOriginalNextSibling = siteNav?.nextSibling || null;
let navIsPortaled = false;
let navScrollY = 0;

function closeNav() {
  if (!navToggle || !siteNav) {
    return;
  }

  siteNav.classList.remove("is-open");
  closeBusinessDropdowns();
  syncNavState();
}

function syncNavPortal(isMobile) {
  if (!siteNav || !navOriginalParent) {
    return;
  }

  if (isMobile && !navIsPortaled) {
    document.body.append(siteNav);
    navIsPortaled = true;
  } else if (!isMobile && navIsPortaled) {
    navOriginalParent.insertBefore(siteNav, navOriginalNextSibling);
    navIsPortaled = false;
  }
}

function syncNavState() {
  if (!navToggle || !siteNav) {
    return;
  }

  const isMobile = window.matchMedia("(max-width: 920px)").matches;
  syncNavPortal(isMobile);
  const isOpen = siteNav.classList.contains("is-open");

  if (isMobile) {
    const isClosed = !isOpen;
    siteNav.inert = isClosed;
    siteNav.toggleAttribute("inert", isClosed);
    siteNav.setAttribute("aria-hidden", String(isClosed));
  } else {
    siteNav.inert = false;
    siteNav.removeAttribute("inert");
    siteNav.removeAttribute("aria-hidden");
    siteNav.classList.remove("is-open");
  }

  const effectiveOpen = isMobile && isOpen;

  if (!isMobile || !isOpen) {
    closeBusinessDropdowns();
  }

  document.documentElement.classList.toggle("nav-is-open", effectiveOpen);
  document.body.classList.toggle("nav-is-open", effectiveOpen);
  navToggle.setAttribute("aria-expanded", String(effectiveOpen));
  navToggle.setAttribute("aria-label", effectiveOpen ? "メニューを閉じる" : "メニューを開く");
  navToggle.textContent = effectiveOpen ? "閉じる" : "メニュー";
}

function closeBusinessDropdowns() {
  document.querySelectorAll(".nav-business").forEach((dropdown) => {
    dropdown.classList.remove("is-open");
    dropdown.querySelector(".nav-business-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function initBusinessDropdowns() {
  const dropdowns = Array.from(document.querySelectorAll(".nav-business"));

  if (!dropdowns.length) {
    return;
  }

  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  const isMobile = () => window.matchMedia("(max-width: 920px)").matches;

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".nav-business-trigger");
    const menu = dropdown.querySelector(".nav-business-subnav");

    if (!trigger || !menu) {
      return;
    }

    const setOpen = (isOpen) => {
      dropdown.classList.toggle("is-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
    };
    let pointerInside = false;
    let suppressFocusOpen = false;

    menu.querySelectorAll("a").forEach((link) => {
      const href = (link.getAttribute("href") || "").split("#")[0];

      if (href === currentFile) {
        link.setAttribute("aria-current", "page");
      }

      link.addEventListener("click", closeNav);
    });

    trigger.addEventListener("click", () => {
      if (!isMobile() && pointerInside) {
        setOpen(true);
        return;
      }

      setOpen(!dropdown.classList.contains("is-open"));
    });

    dropdown.addEventListener("pointerenter", () => {
      pointerInside = true;

      if (!isMobile()) {
        setOpen(true);
      }
    });

    dropdown.addEventListener("pointerleave", () => {
      pointerInside = false;

      if (!isMobile() && !dropdown.contains(document.activeElement)) {
        setOpen(false);
      }
    });

    dropdown.addEventListener("focusin", () => {
      if (suppressFocusOpen) {
        suppressFocusOpen = false;
        return;
      }

      setOpen(true);
    });
    dropdown.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget)) {
        setOpen(false);
      }
    });

    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
        menu.querySelector("a")?.focus();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        suppressFocusOpen = true;
        trigger.focus();
        setOpen(false);
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!dropdown.contains(event.target)) {
        setOpen(false);
      }
    });
  });
}

initBusinessDropdowns();

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const willOpen = !siteNav.classList.contains("is-open");

    if (willOpen) {
      navScrollY = window.scrollY;
    }

    siteNav.classList.toggle("is-open");
    syncNavState();

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: navScrollY,
        left: 0,
        behavior: "auto"
      });
    });
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeNav();
    });
  });

  const navBreakpoint = window.matchMedia("(max-width: 920px)");
  if (typeof navBreakpoint.addEventListener === "function") {
    navBreakpoint.addEventListener("change", syncNavState);
  } else {
    navBreakpoint.addListener(syncNavState);
  }

  syncNavState();
}

function initScrollCue() {
  document.querySelectorAll("[data-scroll-target]").forEach((cue) => {
    cue.addEventListener("click", () => {
      const target = document.querySelector(cue.dataset.scrollTarget);

      if (!target) {
        return;
      }

      const headerOffset = siteHeader?.getBoundingClientRect().height || 0;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: reducedMotionQuery.matches ? "auto" : "smooth"
      });
    });
  });
}

function initHeaderState() {
  const hero = document.querySelector(".home-hero");

  if (!siteHeader || !hero || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      siteHeader.classList.toggle("is-scrolled", !entry.isIntersecting);
    },
    { rootMargin: "-86px 0px 0px 0px", threshold: 0 }
  );

  observer.observe(hero);
}

function initPinkCubeMotion() {
  const cube = document.querySelector("[data-pink-cube]");
  const pieces = Array.from(cube?.querySelectorAll("use") || []);

  if (!cube || !pieces.length) {
    return;
  }

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const ease = (value) => 1 - Math.pow(1 - value, 3);
  const scatterVectors = pieces.map((_, index) => {
    const angle = index * 1.87;
    const radius = 28 + (index % 5) * 11;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius - (index % 3) * 9,
      rotate: ((index % 5) - 2) * 13,
      scale: 0.76 + (index % 4) * 0.06
    };
  });
  let frame = 0;

  const render = () => {
    frame = 0;
    const bounds = cube.getBoundingClientRect();
    const start = window.innerHeight * 1.08;
    const end = window.innerHeight * 0.08;
    const progress = reducedMotionQuery.matches
      ? 1
      : clamp((start - bounds.top) / (start - end), 0, 1);
    const eased = ease(progress);

    pieces.forEach((piece, index) => {
      const scatter = scatterVectors[index];
      const distance = 1 - eased;
      const translateX = scatter.x * distance;
      const translateY = scatter.y * distance;
      const rotate = scatter.rotate * distance;
      const scale = 1 - (1 - scatter.scale) * distance;

      piece.style.transform = `translate(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px) rotate(${rotate.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });

    cube.classList.toggle("is-assembled", progress >= 0.96);
  };

  const requestRender = () => {
    if (!frame) {
      frame = requestAnimationFrame(render);
    }
  };

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);
  requestRender();
}

function initMorphingBackground() {
  const morphBackground = document.querySelector("[data-morph-background]");
  const morphPath = morphBackground?.querySelector("[data-morph-path]");
  const morphShadowPath = morphBackground?.querySelector(".home-morph-shadow");
  const sections = Array.from(document.querySelectorAll("[data-morph-state]"));

  if (!morphBackground || !morphPath || !morphShadowPath) {
    return;
  }

  const shapeStates = [
    {
      path: "M 262.9,252.2 C 210.1,338.2 212.6,487.6 288.8,553.9 C 372.2,626.5 511.2,517.8 620.3,536.3 C 750.6,558.4 860.3,723 987.3,686.5 C 1089,657.3 1168,534.7 1173,429.2 C 1178,313.7 1096,189.1 995.1,130.7 C 852.1,47.07 658.8,78.95 498.1,119.2 C 410.7,141.1 322.6,154.8 262.9,252.2 Z",
      alt: "M 262.9,252.2 C 210.1,338.2 273.3,400.5 298.5,520 C 323.7,639.6 511.2,537.2 620.3,555.7 C 750.6,577.8 872.2,707.4 987.3,686.5 C 1102,665.6 1218,547.8 1173,429.2 C 1128,310.6 1096,189.1 995.1,130.7 C 852.1,47.07 658.8,78.95 498.1,119.2 C 410.7,141.1 322.6,154.8 262.9,252.2 Z"
    },
    {
      path: "M 415.6,206.3 C 407.4,286.6 438.1,373.6 496.2,454.8 C 554.3,536.1 497,597.2 579.7,685.7 C 662.4,774.1 834.3,731.7 898.5,653.4 C 962.3,575 967.1,486 937.7,370 C 909.3,253.9 937.7,201.5 833.4,105.4 C 729.3,9.338 602.2,13.73 530.6,41.91 C 459,70.08 423.9,126.1 415.6,206.3 Z",
      alt: "M 415.6,206.3 C 407.4,286.6 415.5,381.7 473.6,462.9 C 531.7,544.2 482.5,637.6 579.7,685.7 C 676.9,733.8 826.2,710.7 890.4,632.4 C 954.2,554 926.8,487.6 937.7,370 C 948.6,252.4 937.7,201.5 833.4,105.4 C 729.3,9.338 602.2,13.73 530.6,41.91 C 459,70.08 423.9,126.1 415.6,206.3 Z"
    },
    {
      path: "M 383.8,163.4 C 335.8,352.3 591.6,317.1 608.7,420.8 C 625.8,524.5 580.5,626 647.3,688 C 714,750 837.1,760.5 940.9,661.5 C 1044,562.3 1041,455.8 975.8,393.6 C 909.8,331.5 854.2,365.4 784.4,328.1 C 714.6,290.8 771.9,245.2 733.1,132.4 C 694.2,19.52 431.9,-25.48 383.8,163.4 Z",
      alt: "M 383.8,163.4 C 345.5,324.9 591.6,317.1 608.7,420.8 C 625.8,524.5 595.1,597 647.3,688 C 699.5,779 837.1,760.5 940.9,661.5 C 1044,562.3 1068,444.4 975.8,393.6 C 884,342.8 854.2,365.4 784.4,328.1 C 714.6,290.8 820.3,237.2 733.1,132.4 C 645.9,27.62 422.1,1.919 383.8,163.4 Z"
    },
    {
      path: "M 262.9,252.2 C 210.1,338.2 212.6,487.6 288.8,553.9 C 372.2,626.5 511.2,517.8 620.3,536.3 C 750.6,558.4 860.3,723 987.3,686.5 C 1089,657.3 1168,534.7 1173,429.2 C 1178,313.7 1096,189.1 995.1,130.7 C 852.1,47.07 658.8,78.95 498.1,119.2 C 410.7,141.1 322.6,154.8 262.9,252.2 Z",
      alt: "M 262.9,252.2 C 210.1,338.2 273.3,400.5 298.5,520 C 323.7,639.6 511.2,537.2 620.3,555.7 C 750.6,577.8 872.2,707.4 987.3,686.5 C 1102,665.6 1218,547.8 1173,429.2 C 1128,310.6 1096,189.1 995.1,130.7 C 852.1,47.07 658.8,78.95 498.1,119.2 C 410.7,141.1 322.6,154.8 262.9,252.2 Z"
    },
    {
      path: "M 247.6,239.6 C 174.3,404.5 245.5,601.9 358.5,624.3 C 471.5,646.6 569.1,611.6 659.7,655.7 C 750.4,699.7 1068,687.6 1153,534.4 C 1237,381.1 1114,328.4 1127,227.4 C 1140,126.3 1016,51.08 924.6,116.8 C 833.8,182.5 928.4,393.8 706.8,283.5 C 485.2,173.1 320.8,74.68 247.6,239.6 Z",
      alt: "M 247.6,239.6 C 174.3,404.5 271.3,550.3 358.5,624.3 C 445.7,698.3 569.1,611.6 659.7,655.7 C 750.4,699.7 1145,699 1153,534.4 C 1161,369.8 1114,328.4 1127,227.4 C 1140,126.3 1016,51.08 924.6,116.8 C 833.8,182.5 894.5,431 706.8,283.5 C 519.1,136 320.8,74.68 247.6,239.6 Z"
    }
  ];

  const numberPattern = /-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?/gi;
  const extractNumbers = (path) => path.match(numberPattern)?.map(Number) || [];
  const createPathTemplate = (path) => {
    let index = 0;
    return path.replace(numberPattern, () => `__MORPH_${index++}__`);
  };
  const renderPath = (template, points) => template.replace(/__MORPH_(\d+)__/g, (_, index) => Number(points[index]).toFixed(2));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const easeInOutSine = (value) => -(Math.cos(Math.PI * value) - 1) / 2;
  const interpolate = (from, to, progress) => from.map((point, index) => point + (to[index] - point) * progress);

  const pathStates = shapeStates.map((state) => ({
    ...state,
    points: extractNumbers(state.path),
    altPoints: extractNumbers(state.alt)
  }));
  const pathTemplate = createPathTemplate(pathStates[0].path);

  let currentPoints = [...pathStates[0].points];
  let targetMorphState = 0;
  let displayMorphState = 0;
  let morphAnchors = [];
  let loopStartedAt = performance.now();
  let lastFrameAt = loopStartedAt;
  let animationFrame = 0;

  const pointLengths = pathStates.flatMap((state) => [state.points.length, state.altPoints.length]);
  if (!pointLengths.length || new Set(pointLengths).size !== 1) {
    return;
  }

  const render = (points) => {
    const path = renderPath(pathTemplate, points);
    morphPath.setAttribute("d", path);
    morphShadowPath.setAttribute("d", path);
  };

  const measureMorphAnchors = () => {
    const scrollTop = window.scrollY || window.pageYOffset || 0;
    const viewportOffset = window.innerHeight * 0.42;

    morphAnchors = sections
      .map((section) => ({
        position: section.getBoundingClientRect().top + scrollTop - viewportOffset,
        state: Number(section.dataset.morphState)
      }))
      .filter((anchor) => Number.isFinite(anchor.state))
      .map((anchor) => ({
        ...anchor,
        position: Math.max(0, anchor.position)
      }))
      .sort((from, to) => from.position - to.position);

    if (!morphAnchors.length) {
      morphAnchors = [{ position: 0, state: 0 }];
    }

    morphAnchors[0].position = 0;
  };

  const getScrollMorphState = (scrollTop) => {
    if (morphAnchors.length === 1 || scrollTop <= morphAnchors[0].position) {
      return morphAnchors[0].state;
    }

    for (let index = 1; index < morphAnchors.length; index += 1) {
      const previous = morphAnchors[index - 1];
      const next = morphAnchors[index];

      if (scrollTop <= next.position) {
        const distance = Math.max(next.position - previous.position, 1);
        const progress = clamp((scrollTop - previous.position) / distance, 0, 1);
        return previous.state + (next.state - previous.state) * progress;
      }
    }

    return morphAnchors[morphAnchors.length - 1].state;
  };

  const pointsForMorphState = (morphState, now) => {
    const safeState = clamp(morphState, 0, pathStates.length - 1);
    const lowerState = Math.floor(safeState);
    const upperState = Math.min(lowerState + 1, pathStates.length - 1);
    const stateProgress = safeState - lowerState;
    const basePoints = interpolate(pathStates[lowerState].points, pathStates[upperState].points, stateProgress);
    const altPoints = interpolate(pathStates[lowerState].altPoints, pathStates[upperState].altPoints, stateProgress);

    if (reducedMotionQuery.matches) {
      return basePoints;
    }

    const cycleProgress = ((now - loopStartedAt) % 5200) / 5200;
    const loopProgress = easeInOutSine(0.5 - 0.5 * Math.cos(cycleProgress * Math.PI * 2));
    return interpolate(basePoints, altPoints, loopProgress);
  };

  const refreshMorphAnchors = () => {
    measureMorphAnchors();
    targetMorphState = getScrollMorphState(window.scrollY || window.pageYOffset || 0);

    if (reducedMotionQuery.matches) {
      displayMorphState = targetMorphState;
    }
  };

  const tick = (now) => {
    const deltaTime = Math.min(Math.max(now - lastFrameAt, 0), 80);
    lastFrameAt = now;
    targetMorphState = getScrollMorphState(window.scrollY || window.pageYOffset || 0);

    if (reducedMotionQuery.matches) {
      displayMorphState = targetMorphState;
    } else {
      const followProgress = 1 - Math.exp(-deltaTime / 360);
      displayMorphState += (targetMorphState - displayMorphState) * followProgress;
    }

    currentPoints = pointsForMorphState(displayMorphState, now);

    render(currentPoints);
    animationFrame = requestAnimationFrame(tick);
  };

  refreshMorphAnchors();
  window.addEventListener("resize", refreshMorphAnchors, { passive: true });
  window.addEventListener("load", refreshMorphAnchors, { once: true, passive: true });
  morphBackground.classList.add("is-ready");
  displayMorphState = targetMorphState;
  currentPoints = pointsForMorphState(displayMorphState, performance.now());
  render(currentPoints);
  animationFrame = requestAnimationFrame(tick);
}

const revealSelectors = [
  ".home-page .reveal-item",
  ".home-page .home-hero",
  ".home-page .home-reveal-scene",
  ".hero-inner > *",
  ".hero-motion-scene",
  ".page-hero .container > *",
  ".section-heading > *",
  ".intro-grid > *",
  ".motion-scene",
  ".card-grid > *",
  ".service-list > *",
  ".split > *",
  ".company-table > *",
  ".contact-grid > *",
  ".policy > *",
  ".cta-band > *"
].join(", ");

function initScrollReveal() {
  const revealItems = Array.from(document.querySelectorAll(revealSelectors));
  const uniqueTargets = Array.from(new Set(revealItems));

  if (!uniqueTargets.length) {
    return;
  }

  const itemIndexes = new Map();

  uniqueTargets.forEach((item) => {
    if (!item.matches(".home-hero, .home-reveal-scene, .hero-motion-scene, .motion-scene")) {
      const parent = item.parentElement;
      const itemIndex = itemIndexes.get(parent) || 0;

      item.classList.add("reveal-item");
      if (!item.style.getPropertyValue("--reveal-delay")) {
        item.style.setProperty("--reveal-delay", `${Math.min(itemIndex, 5) * 70}ms`);
      }
      itemIndexes.set(parent, itemIndex + 1);
    }
  });

  root.classList.add("has-reveal");

  const showAll = () => {
    uniqueTargets.forEach((item) => item.classList.add("is-visible"));
  };

  if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  const replayMotionAssets = (target) => {
    if (!target.matches("[data-replay-motion]")) {
      return;
    }

    target.querySelectorAll("img[data-motion-asset]").forEach((image, index) => {
      const source = image.getAttribute("src");
      if (!source) {
        return;
      }

      const baseSource = source.split("?")[0];
      image.setAttribute("src", `${baseSource}?motion=${Date.now()}-${index}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.12) {
          replayMotionAssets(entry.target);
          entry.target.classList.add("is-visible");
        } else if (!entry.isIntersecting) {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      rootMargin: "0px 0px -10% 0px",
      threshold: [0, 0.12]
    }
  );

  uniqueTargets.forEach((item) => observer.observe(item));
}

initScrollCue();
initHeaderState();
initPinkCubeMotion();
initMorphingBackground();
initScrollReveal();
