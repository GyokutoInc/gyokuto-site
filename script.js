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

function initCursorFollower() {
  const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (!pointerQuery.matches || reducedMotionQuery.matches) {
    return;
  }

  const orb = document.createElement("span");
  const dot = document.createElement("span");
  orb.className = "cursor-follower";
  dot.className = "cursor-follower-dot";
  orb.setAttribute("aria-hidden", "true");
  dot.setAttribute("aria-hidden", "true");
  document.body.append(orb, dot);

  const pointer = { x: -100, y: -100 };
  const orbPosition = { x: -100, y: -100 };
  const dotPosition = { x: -100, y: -100 };
  let active = false;
  let frame = 0;

  const render = () => {
    const orbEase = active ? 0.12 : 0.2;
    const dotEase = active ? 0.28 : 0.2;

    orbPosition.x += (pointer.x - orbPosition.x) * orbEase;
    orbPosition.y += (pointer.y - orbPosition.y) * orbEase;
    dotPosition.x += (pointer.x - dotPosition.x) * dotEase;
    dotPosition.y += (pointer.y - dotPosition.y) * dotEase;

    const orbScale = orb.classList.contains("is-hovering") ? 1.55 : 1;
    const dotScale = dot.classList.contains("is-hovering") ? 1.25 : 1;

    orb.style.transform = `translate3d(${orbPosition.x.toFixed(2)}px, ${orbPosition.y.toFixed(2)}px, 0) translate(-50%, -50%) scale(${orbScale})`;
    dot.style.transform = `translate3d(${dotPosition.x.toFixed(2)}px, ${dotPosition.y.toFixed(2)}px, 0) translate(-50%, -50%) scale(${dotScale})`;

    const orbDistance = Math.hypot(pointer.x - orbPosition.x, pointer.y - orbPosition.y);
    const dotDistance = Math.hypot(pointer.x - dotPosition.x, pointer.y - dotPosition.y);

    if (active || orbDistance > 0.2 || dotDistance > 0.2) {
      frame = requestAnimationFrame(render);
    } else {
      frame = 0;
    }
  };

  const requestRender = () => {
    if (!frame) {
      frame = requestAnimationFrame(render);
    }
  };

  const setHoverState = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("a, button, input, textarea, select, [role=button]")
      : null;

    orb.classList.toggle("is-hovering", Boolean(target));
    dot.classList.toggle("is-hovering", Boolean(target));
  };

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    active = true;
    root.classList.add("has-cursor-follower");
    setHoverState(event);
    requestRender();
  }, { passive: true });

  window.addEventListener("pointerout", (event) => {
    if (event.relatedTarget) {
      return;
    }

    active = false;
    root.classList.remove("has-cursor-follower");
    orb.classList.remove("is-hovering");
    dot.classList.remove("is-hovering");
    requestRender();
  }, { passive: true });

  window.addEventListener("pointerdown", () => {
    orb.classList.add("is-pressing");
    dot.classList.add("is-pressing");
  }, { passive: true });

  window.addEventListener("pointerup", () => {
    orb.classList.remove("is-pressing");
    dot.classList.remove("is-pressing");
  }, { passive: true });
}

function closeNav() {
  if (!navToggle || !siteNav) {
    return;
  }

  siteNav.classList.remove("is-open");
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
  document.documentElement.classList.toggle("nav-is-open", effectiveOpen);
  document.body.classList.toggle("nav-is-open", effectiveOpen);
  navToggle.setAttribute("aria-expanded", String(effectiveOpen));
  navToggle.setAttribute("aria-label", effectiveOpen ? "メニューを閉じる" : "メニューを開く");
  navToggle.textContent = effectiveOpen ? "閉じる" : "メニュー";
}

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
      if (link.getAttribute("href")?.startsWith("#")) {
        closeNav();
      }
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

function initBusinessBlobButtons() {
  const blobs = Array.from(document.querySelectorAll("[data-business-blob]"));

  if (!blobs.length) {
    return;
  }

  const createPoints = (phaseOffset) => {
    const pointCount = 10;
    const angleStep = (Math.PI * 2) / pointCount;

    return Array.from({ length: pointCount }, (_, index) => {
      const angle = index * angleStep;

      return {
        angle,
        baseRadius: 71 + ((index % 4) - 1.5) * 3,
        phase: phaseOffset + index * 0.82,
        x: 100 + Math.cos(angle) * 71,
        y: 100 + Math.sin(angle) * 71
      };
    });
  };

  const createSmoothPath = (points) => {
    const pointAt = (index) => points[(index + points.length) % points.length];
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

    points.forEach((current, index) => {
      const previous = pointAt(index - 1);
      const next = pointAt(index + 1);
      const nextNext = pointAt(index + 2);
      const controlOneX = current.x + (next.x - previous.x) / 6;
      const controlOneY = current.y + (next.y - previous.y) / 6;
      const controlTwoX = next.x - (nextNext.x - current.x) / 6;
      const controlTwoY = next.y - (nextNext.y - current.y) / 6;

      path += ` C ${controlOneX.toFixed(2)} ${controlOneY.toFixed(2)} ${controlTwoX.toFixed(2)} ${controlTwoY.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
    });

    return `${path} Z`;
  };

  blobs.forEach((blob, blobIndex) => {
    const path = blob.querySelector("[data-business-blob-path]");
    const gradient = blob.querySelector("linearGradient");
    const points = createPoints(blobIndex * 1.7);
    let hoverTarget = 0;
    let hoverProgress = 0;

    if (!path) {
      return;
    }

    const render = (time) => {
      hoverProgress += (hoverTarget - hoverProgress) * 0.08;
      const phase = time * 0.00078 + blobIndex * 0.8;
      const primaryAmplitude = 14 + hoverProgress * 4;
      const secondaryAmplitude = 7 + hoverProgress * 2;
      const tertiaryAmplitude = 4 + hoverProgress * 2;
      const driftAmplitude = 4.5 + hoverProgress * 2.5;

      points.forEach((point) => {
        const wobble = Math.sin(phase + point.phase) * primaryAmplitude
          + Math.sin(phase * 0.61 + point.phase * 1.7) * secondaryAmplitude
          + Math.cos(phase * 0.31 + point.phase * 2.4) * tertiaryAmplitude;
        const driftX = Math.sin(phase * 0.34 + point.phase) * driftAmplitude;
        const driftY = Math.cos(phase * 0.29 + point.phase) * driftAmplitude;
        const radius = point.baseRadius + wobble;

        point.x = 100 + Math.cos(point.angle) * radius + driftX;
        point.y = 100 + Math.sin(point.angle) * radius + driftY;
      });

      path.setAttribute("d", createSmoothPath(points));

      if (gradient) {
        const rotation = 90 + Math.sin(phase * 0.45) * 34;
        gradient.setAttribute("gradientTransform", `rotate(${rotation.toFixed(2)} 100 100)`);
      }

      if (!reducedMotionQuery.matches) {
        requestAnimationFrame(render);
      }
    };

    const setHovered = (value) => {
      hoverTarget = value ? 1 : 0;
    };

    blob.addEventListener("mouseenter", () => setHovered(true));
    blob.addEventListener("mouseleave", () => setHovered(false));
    blob.addEventListener("focusin", () => setHovered(true));
    blob.addEventListener("focusout", (event) => {
      if (!blob.contains(event.relatedTarget)) {
        setHovered(false);
      }
    });

    render(0);
  });
}

function initMorphingBackground() {
  const morphBackground = document.querySelector("[data-morph-background]");
  const morphPath = morphBackground?.querySelector("[data-morph-path]");
  const morphShadowPath = morphBackground?.querySelector(".home-morph-shadow");
  const sections = Array.from(document.querySelectorAll(".home-hero, .home-section, .home-contact"));

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
  const easeOutElastic = (value) => {
    if (value === 0 || value === 1) {
      return value;
    }

    const period = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * value) * Math.sin((value * 10 - 0.75) * period) + 1;
  };
  const easeInOutSine = (value) => -(Math.cos(Math.PI * value) - 1) / 2;
  const interpolate = (from, to, progress) => from.map((point, index) => point + (to[index] - point) * progress);

  const pathStates = shapeStates.map((state) => ({
    ...state,
    points: extractNumbers(state.path),
    altPoints: extractNumbers(state.alt)
  }));
  const pathTemplate = createPathTemplate(pathStates[0].path);

  let currentPoints = [...pathStates[0].points];
  let currentState = 0;
  let transition = null;
  let loopStartedAt = performance.now();
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

  const morphTo = (nextState, duration = 2200) => {
    if (transition?.state === nextState || (!transition && nextState === currentState)) {
      return;
    }

    if (reducedMotionQuery.matches) {
      currentState = nextState;
      currentPoints = [...pathStates[nextState].points];
      transition = null;
      loopStartedAt = performance.now();
      render(currentPoints);
      return;
    }

    const from = [...currentPoints];
    transition = {
      from,
      to: [...pathStates[nextState].points],
      state: nextState,
      startedAt: performance.now(),
      duration
    };
  };

  const tick = (now) => {
    if (transition) {
      const progress = clamp((now - transition.startedAt) / transition.duration, 0, 1);
      currentPoints = interpolate(transition.from, transition.to, easeOutElastic(progress));

      if (progress >= 1) {
        currentState = transition.state;
        currentPoints = [...transition.to];
        transition = null;
        loopStartedAt = now;
      }
    } else if (reducedMotionQuery.matches) {
      currentPoints = [...pathStates[currentState].points];
    } else {
      const cycleProgress = ((now - loopStartedAt) % 5200) / 5200;
      const loopProgress = easeInOutSine(0.5 - 0.5 * Math.cos(cycleProgress * Math.PI * 2));
      currentPoints = interpolate(pathStates[currentState].points, pathStates[currentState].altPoints, loopProgress);
    }

    render(currentPoints);
    animationFrame = requestAnimationFrame(tick);
  };

  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const state = Number(entry.target.dataset.morphState);
          if (Number.isInteger(state) && state >= 0 && state < pathStates.length) {
            morphTo(state);
          }
        });
      }, { rootMargin: "-35% 0px -45% 0px", threshold: 0 })
    : null;

  sections.forEach((section) => observer?.observe(section));
  morphBackground.classList.add("is-ready");
  currentPoints = [...pathStates[0].points];
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
initCursorFollower();
initPinkCubeMotion();
initBusinessBlobButtons();
initMorphingBackground();
initScrollReveal();
