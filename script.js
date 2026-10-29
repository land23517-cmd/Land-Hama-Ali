(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var lenis = null;
  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    } else if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    } else {
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }

  var preloader = doc.querySelector(".preloader");
  var preCount = doc.querySelector(".preloader-count");
  var preDone = false;
  function finishPreloader() {
    if (preDone || !preloader) return;
    preDone = true;
    preloader.classList.add("done");
    body.classList.add("loaded");
    setTimeout(function () { preloader.remove(); }, 1100);
  }
  if (preloader && preCount) {
    var val = 0;
    var tick = setInterval(function () {
      val = Math.min(100, val + Math.ceil(Math.random() * 8));
      preCount.textContent = String(val).padStart(3, "0");
      if (val >= 100) {
        clearInterval(tick);
        setTimeout(finishPreloader, reduced ? 50 : 350);
      }
    }, 38);
    setTimeout(finishPreloader, 4000);
  } else {
    body.classList.add("loaded");
  }

  if (window.Lenis && !reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);
  }

  function splitChars(el) {
    var text = el.textContent;
    el.textContent = "";
    Array.prototype.forEach.call(text, function (ch, i) {
      var wrap = doc.createElement("span");
      wrap.className = "char-wrap";
      var c = doc.createElement("span");
      c.className = "char";
      c.textContent = ch === " " ? "\u00A0" : ch;
      c.style.transitionDelay = (i * 30) + "ms";
      wrap.appendChild(c);
      el.appendChild(wrap);
    });
  }

  doc.querySelectorAll("[data-chars]").forEach(splitChars);

  var projects = [
    { title: "SHOT ON SONY", category: "AUTOMOTIVE / PHOTOGRAPHY", thumbnail: "SHOT ON SONY.PNG" }
  ];

  function projectImage(p) {
    return p.thumbnail ? p.thumbnail : "assets/placeholder.svg";
  }

  var workGrid = doc.getElementById("work-grid");
  var ctaCard = doc.getElementById("cta-card");
  if (workGrid && ctaCard) {
    projects.forEach(function (p, i) {
      var card = doc.createElement(p.youtubeUrl ? "a" : "article");
      card.className = "work-card" + (p.featured ? " featured" : "");
      if (p.youtubeUrl) {
        card.href = p.youtubeUrl;
        card.setAttribute("aria-label", "Watch " + p.title + " on YouTube");
      } else {
        card.setAttribute("aria-label", p.title + " video thumbnail will be added soon");
      }
      card.dataset.reveal = "";
      var media = doc.createElement("figure");
      media.className = "wc-media";
      var img = doc.createElement("img");
      img.src = projectImage(p);
      img.alt = p.title + " video thumbnail";
      img.loading = "lazy";
      media.appendChild(img);
      var index = doc.createElement("span");
      index.className = "wc-index mono";
      index.textContent = "IMAGE 01 / 01";
      media.appendChild(index);
      card.appendChild(media);
      var info = doc.createElement("div");
      info.className = "wc-info";
      var heading = doc.createElement("h3");
      heading.textContent = p.title;
      var category = doc.createElement("span");
      category.className = "mono";
      category.textContent = p.category;
      info.append(heading, category);
      card.appendChild(info);
      workGrid.insertBefore(card, ctaCard);
    });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

  doc.querySelectorAll("[data-reveal], [data-chars]").forEach(function (el) {
    io.observe(el);
  });

  var counters = doc.querySelectorAll("[data-count]");
  if (counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || entry.target.dataset.done) return;
        entry.target.dataset.done = "1";
        cio.unobserve(entry.target);
        var el = entry.target;
        var end = parseInt(el.dataset.count, 10);
        if (reduced) { el.textContent = end; return; }
        var start = performance.now();
        var dur = 1400;
        (function step(now) {
          var p = Math.min(1, (now - start) / dur);
          p = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(end * p);
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  var fillPara = doc.querySelector("[data-fill]");
  var fillWords = [];
  var lastLit = -1;
  if (fillPara) {
    var words = fillPara.textContent.trim().split(/\s+/);
    fillPara.innerHTML = words.map(function (w) {
      return '<span class="fw">' + w + "</span>";
    }).join(" ");
    fillWords = Array.prototype.slice.call(fillPara.querySelectorAll(".fw"));
  }
  function updateFill() {
    if (!fillWords.length) return;
    var r = fillPara.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * 0.88 - r.top) / (r.height + vh * 0.42);
    p = Math.max(0, Math.min(1, p));
    var lit = Math.floor(p * fillWords.length);
    if (lit === lastLit) return;
    lastLit = lit;
    fillWords.forEach(function (w, i) {
      w.classList.toggle("lit", i < lit);
    });
  }

  var parallaxEls = Array.prototype.slice.call(doc.querySelectorAll("[data-parallax]"));
  function updateParallax() {
    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.dataset.parallax) || 0.1;
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      var d = (r.top + r.height / 2 - window.innerHeight / 2) * speed;
      el.style.transform = "translate3d(0," + d.toFixed(2) + "px,0)";
    });
  }

  var progressBar = doc.querySelector(".progress span");
  var navEl = doc.querySelector(".nav");
  var heroBottom = doc.querySelector(".hero-bottom");
  var contactRows = Array.prototype.slice.call(doc.querySelectorAll("#contact .c-row"));
  var lastContactPointerY = null;
  var contactPointerDirection = 0;
  if (contactRows.length) {
    window.addEventListener("pointermove", function (event) {
      if (lastContactPointerY !== null) {
        contactPointerDirection = event.clientY - lastContactPointerY;
      }
      lastContactPointerY = event.clientY;
    }, { passive: true });
    contactRows.forEach(function (row) {
      row.addEventListener("pointerenter", function () {
        if (contactPointerDirection !== 0) {
          row.style.setProperty("--bar-origin", contactPointerDirection < 0 ? "bottom" : "top");
        }
      });
      row.addEventListener("pointerleave", function () {
        if (contactPointerDirection !== 0) {
          row.style.setProperty("--bar-origin", contactPointerDirection < 0 ? "top" : "bottom");
        }
      });
    });
  }

  function frame() {
    updateFill();
    updateParallax();
    if (progressBar) {
      var sy = window.scrollY || doc.documentElement.scrollTop;
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = "scaleX(" + (max > 0 ? sy / max : 0) + ")";
    }
    if (navEl) {
      navEl.classList.toggle("scrolled", (window.scrollY || 0) > 40);
    }
    if (heroBottom) {
      var hr = heroBottom.getBoundingClientRect();
      heroBottom.style.opacity = Math.max(0, Math.min(1, 1 + (hr.top - window.innerHeight * 0.55) / (window.innerHeight * 0.45)));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if (finePointer) {
    var dot = doc.querySelector(".cursor-dot");
    var shown = false;
    window.addEventListener("mousemove", function (e) {
      if (!shown) {
        shown = true;
        dot.style.opacity = "1";
      }
      dot.style.transform = "translate(" + (e.clientX - 3) + "px," + (e.clientY - 3) + "px)";
    });
  }

  if (finePointer && !reduced) {
    doc.querySelectorAll(".work-card .wc-media").forEach(function (m) {
      m.addEventListener("pointermove", function (ev) {
        var r = m.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        m.style.transform = "perspective(900px) rotateX(" + (-py * 6).toFixed(2) + "deg) rotateY(" + (px * 8).toFixed(2) + "deg)";
      });
      m.addEventListener("pointerleave", function () {
        m.style.transform = "";
      });
    });
    doc.querySelectorAll(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (ev) {
        var r = b.getBoundingClientRect();
        var dx = (ev.clientX - r.left - r.width / 2) * 0.25;
        var dy = (ev.clientY - r.top - r.height / 2) * 0.4;
        b.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () {
        b.style.transform = "";
      });
    });
  }


  var toggle = doc.querySelector(".nav-toggle");
  function closeMenu() {
    if (!body.classList.contains("menu-open")) return;
    body.classList.remove("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }
  function openMenu() {
    body.classList.add("menu-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    if (lenis) lenis.stop();
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      if (body.classList.contains("menu-open")) closeMenu(); else openMenu();
    });
  }

  doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = doc.querySelector(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(t);
    });
  });

  var toTop = doc.querySelector(".to-top");
  if (toTop) {
    toTop.addEventListener("click", function () {
      scrollToTarget(0);
    });
  }

  var navAnchors = doc.querySelectorAll(".nav-links a");
  var sections = [];
  navAnchors.forEach(function (a) {
    var s = doc.querySelector(a.getAttribute("href"));
    if (s) sections.push({ link: a, sec: s });
  });
  if (sections.length) {
    var aio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sections.forEach(function (o) {
          o.link.classList.toggle("active", o.sec === entry.target);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (o) { aio.observe(o.sec); });
  }

  var modal = doc.querySelector(".modal");
  var modalFrame = doc.querySelector(".modal-frame");
  var lastFocus = null;
  function openModal(src) {
    if (!modal || !src) return;
    lastFocus = doc.activeElement;
    modalFrame.innerHTML = '<iframe src="' + src + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("locked");
    if (lenis) lenis.stop();
    var btn = modal.querySelector(".modal-close");
    if (btn) btn.focus();
  }
  function closeModal() {
    if (!modal || !modal.classList.contains("open")) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    setTimeout(function () { modalFrame.innerHTML = ""; }, 400);
    body.classList.remove("locked");
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus();
  }
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    var closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
  }
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
      closeMenu();
    }
  });

  var clock = doc.getElementById("clock");
  if (clock) {
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Baghdad",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (err) {
      fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
    }
    function updateClock() { clock.textContent = fmt.format(new Date()); }
    updateClock();
    setInterval(updateClock, 15000);
  }

  var yearEl = doc.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
