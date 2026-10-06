const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileQuery = window.matchMedia("(max-width: 57em)");

const header = document.querySelector(".header");
const navToggle = document.querySelector(".btn--nav");
const nav = document.querySelector(".header__nav");

function setNav(open) {
  header.classList.toggle("nav--open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  document.body.classList.toggle("nav-locked", open);
  if (!open) {
    document.querySelectorAll(".nav__item--open").forEach((item) => item.classList.remove("nav__item--open"));
  }
}

navToggle.addEventListener("click", () => setNav(!header.classList.contains("nav--open")));

header.addEventListener("click", (e) => {
  if (e.target === header && header.classList.contains("nav--open")) setNav(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setNav(false);
});

nav.querySelectorAll(".nav__item--dropdown > .link--nav").forEach((link) => {
  link.addEventListener("click", (e) => {
    if (!mobileQuery.matches) return;
    e.preventDefault();
    link.parentElement.classList.toggle("nav__item--open");
  });
});

nav.querySelectorAll("a:not(.nav__item--dropdown > .link--nav)").forEach((link) => {
  link.addEventListener("click", () => setNav(false));
});

mobileQuery.addEventListener("change", () => setNav(false));

const backToTop = document.querySelector(".back-to-top");

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("header--scrolled", y > 10);
  backToTop.classList.toggle("back-to-top--visible", y > 800);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children].filter((el) => el.classList.contains("reveal"));
      entry.target.style.transitionDelay = `${siblings.indexOf(entry.target) * 100}ms`;
      entry.target.classList.add("reveal--visible");
      entry.target.addEventListener("transitionend", () => (entry.target.style.transitionDelay = ""), { once: true });
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const formatNumber = (n) => n.toLocaleString("en-US");

function countUp(el) {
  const target = Number(el.dataset.target);
  if (reducedMotion) {
    el.textContent = formatNumber(target);
    return;
  }
  const duration = 1600;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatNumber(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statsObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.6 }
);

document.querySelectorAll("[data-target]").forEach((el) => statsObserver.observe(el));

const filterButtons = document.querySelectorAll(".filter-btn");
const jobs = document.querySelectorAll(".job-listing__job");
const jobsEmpty = document.querySelector(".jobs__empty");

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    filterButtons.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("filter-btn--active", active);
      b.setAttribute("aria-selected", String(active));
    });

    let visible = 0;
    jobs.forEach((job) => {
      const match = filter === "all" || job.dataset.category === filter;
      job.classList.remove("job-listing__job--entering");
      job.classList.toggle("job-listing__job--hidden", !match);
      if (match) {
        void job.offsetWidth;
        job.classList.add("job-listing__job--entering");
        visible++;
      }
    });
    jobsEmpty.hidden = visible > 0;
  });
});

document.querySelectorAll(".btn--bookmark").forEach((btn) => {
  btn.addEventListener("click", () => {
    const saved = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(saved));
    btn.setAttribute("aria-label", saved ? "Remove saved job" : "Save job");
    btn.querySelector("ion-icon").setAttribute("name", saved ? "bookmark" : "bookmark-outline");
  });
});

const slider = document.querySelector(".slider");
const track = slider.querySelector(".slider__track");
const slides = [...track.children];
const dotsContainer = slider.querySelector(".slider__dots");
let current = 0;
let autoplay = null;

function perView() {
  return Math.max(1, Math.round(track.parentElement.clientWidth / slides[0].offsetWidth));
}

function maxIndex() {
  return slides.length - perView();
}

function buildDots() {
  dotsContainer.innerHTML = "";
  for (let i = 0; i <= maxIndex(); i++) {
    const dot = document.createElement("button");
    dot.className = "slider__dot";
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => {
      goTo(i);
      restartAutoplay();
    });
    dotsContainer.appendChild(dot);
  }
}

function goTo(index) {
  const max = maxIndex();
  current = index > max ? 0 : index < 0 ? max : index;
  track.style.transform = `translateX(-${slides[current].offsetLeft - slides[0].offsetLeft}px)`;
  [...dotsContainer.children].forEach((dot, i) => dot.classList.toggle("slider__dot--active", i === current));
}

function startAutoplay() {
  if (reducedMotion) return;
  stopAutoplay();
  autoplay = setInterval(() => goTo(current + 1), 5000);
}

function stopAutoplay() {
  clearInterval(autoplay);
}

function restartAutoplay() {
  stopAutoplay();
  startAutoplay();
}

slider.querySelectorAll(".btn--slider").forEach((btn) => {
  btn.addEventListener("click", () => {
    goTo(current + (btn.dataset.dir === "next" ? 1 : -1));
    restartAutoplay();
  });
});

slider.addEventListener("mouseenter", stopAutoplay);
slider.addEventListener("mouseleave", startAutoplay);
slider.addEventListener("focusin", stopAutoplay);
slider.addEventListener("focusout", startAutoplay);

let touchStartX = 0;
track.addEventListener("touchstart", (e) => (touchStartX = e.touches[0].clientX), { passive: true });
track.addEventListener("touchend", (e) => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) < 50) return;
  goTo(current + (diff < 0 ? 1 : -1));
  restartAutoplay();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildDots();
    goTo(Math.min(current, maxIndex()));
  }, 150);
});

buildDots();
goTo(0);
startAutoplay();

const billingSwitch = document.querySelector(".billing-toggle__switch");
const billingLabels = document.querySelectorAll(".billing-toggle__label");
const prices = document.querySelectorAll(".pricing-card__amount");

function setBilling(yearly) {
  billingSwitch.setAttribute("aria-checked", String(yearly));
  billingLabels.forEach((label) =>
    label.classList.toggle("billing-toggle__label--active", (label.dataset.period === "yearly") === yearly)
  );
  prices.forEach((price) => {
    price.classList.add("pricing-card__amount--changing");
    setTimeout(() => {
      price.textContent = `$${yearly ? price.dataset.yearly : price.dataset.monthly}`;
      price.classList.remove("pricing-card__amount--changing");
    }, 200);
  });
}

billingSwitch.addEventListener("click", () => setBilling(billingSwitch.getAttribute("aria-checked") !== "true"));
billingLabels.forEach((label) => {
  label.addEventListener("click", () => setBilling(label.dataset.period === "yearly"));
});

const faqItems = document.querySelectorAll(".faq__item");

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});

document.querySelectorAll(".js-fake-form").forEach((form) => {
  const message = form.querySelector(".form__message");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("input[type='email']").value;
    message.textContent = `Thanks! We'll be in touch at ${email}.`;
    form.reset();
    setTimeout(() => (message.textContent = ""), 5000);
  });
});

document.querySelectorAll(".year").forEach((el) => (el.textContent = new Date().getFullYear()));
