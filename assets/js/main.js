document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile nav ---------- */
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? 'CLOSE' : 'MENU';
    });
  }

  /* ---------- nav shadow on scroll ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- scroll reveal ---------- */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  /* ---------- rotating roles (hero) ---------- */
  const roleEl = document.querySelector('.rotator .role');
  if (roleEl) {
    const roles = JSON.parse(roleEl.dataset.roles || '[]');
    let i = 0;
    if (roles.length > 1) {
      setInterval(() => {
        roleEl.classList.add('swap-out');
        setTimeout(() => {
          i = (i + 1) % roles.length;
          roleEl.textContent = roles[i];
          roleEl.classList.remove('swap-out');
        }, 250);
      }, 2600);
    }
  }

  /* ---------- hero video scrub: delta-based, full hero band, graceful rewind ---------- */
  const heroVideo = document.querySelector('.hero-video');
  const heroSection = document.querySelector('.doc-hero');
  if (heroVideo && heroSection) {
    let videoReady = heroVideo.readyState >= 1;
    let targetTime = 0;
    let prevX = null;
    let isSeeking = false;
    let rewindRAF = null;
    let isRewinding = false;
    let hasInteracted = false;
    let heroRect = null;
    const SENSITIVITY = 0.8;

    heroVideo.pause();

    const getHeroRect = () => { heroRect = heroSection.getBoundingClientRect(); };
    getHeroRect();
    window.addEventListener('resize', getHeroRect, { passive: true });
    window.addEventListener('scroll', getHeroRect, { passive: true });

    const trySeek = () => {
      if (!videoReady || isSeeking) return;
      if (Math.abs(heroVideo.currentTime - targetTime) > 0.02) {
        isSeeking = true;
        heroVideo.currentTime = targetTime;
      }
    };

    const onSeeked = () => {
      isSeeking = false;
      trySeek();
    };

    heroVideo.addEventListener('seeked', onSeeked);

    const initVideo = () => {
      videoReady = true;
      targetTime = 0;
      heroVideo.currentTime = 0;
    };

    if (videoReady && heroVideo.duration) initVideo();
    heroVideo.addEventListener('loadeddata', initVideo);
    heroVideo.addEventListener('canplay', () => { if (!videoReady) initVideo(); });

    const stopRewind = () => {
      if (rewindRAF !== null) { cancelAnimationFrame(rewindRAF); rewindRAF = null; }
      if (!heroVideo.paused) heroVideo.pause();
      if (heroVideo.playbackRate !== 1) heroVideo.playbackRate = 1;
      isRewinding = false;
    };

    /* graceful playback back to the middle frame (plays, not jumps) */
    const rewindToMiddle = () => {
      if (!videoReady || !heroVideo.duration || isRewinding) return;
      if (!hasInteracted) return;
      const mid = heroVideo.duration * 0.5;
      const cur = heroVideo.currentTime;
      if (Math.abs(cur - mid) < 0.06) { targetTime = mid; return; }

      isRewinding = true;
      targetTime = mid;
      const dir = cur < mid ? 1 : -1;
      heroVideo.playbackRate = dir;
      heroVideo.play().catch(() => {});

      let lastT = cur;
      let stuck = 0;
      const watch = () => {
        if (rewindRAF === null) return;
        const t = heroVideo.currentTime;
        if ((dir > 0 && t >= mid) || (dir < 0 && t <= mid)) {
          heroVideo.pause();
          heroVideo.playbackRate = 1;
          heroVideo.currentTime = mid;
          targetTime = mid;
          rewindRAF = null;
          isRewinding = false;
          return;
        }
        if (Math.abs(t - lastT) < 0.01) {
          stuck++;
          if (stuck > 60) {
            const step = dir * 0.2;
            heroVideo.currentTime = Math.max(0, Math.min(heroVideo.duration, t + step));
          }
        } else { stuck = 0; }
        lastT = t;
        rewindRAF = requestAnimationFrame(watch);
      };
      rewindRAF = requestAnimationFrame(watch);
    };

    /* scrub zone = the hero's full-height band, edge to edge (margins included) */
    const inHeroBand = (y) => {
      if (!heroRect) return false;
      return y >= heroRect.top - 10 && y <= heroRect.bottom + 10;
    };

    window.addEventListener('mousemove', (e) => {
      if (!inHeroBand(e.clientY)) {
        prevX = null;
        rewindToMiddle();
        return;
      }
      hasInteracted = true;
      stopRewind();
      if (!videoReady || !heroVideo.duration) return;
      if (prevX === null) { prevX = e.clientX; return; }
      const delta = e.clientX - prevX;
      prevX = e.clientX;
      const offset = (delta / window.innerWidth) * SENSITIVITY * heroVideo.duration;
      targetTime = Math.max(0, Math.min(targetTime + offset, heroVideo.duration));
      trySeek();
    });

    document.addEventListener('mouseleave', () => {
      prevX = null;
      rewindToMiddle();
    });
  }

  /* ---------- work filters ---------- */
  const filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    const buttons = filterBar.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.work-item');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        items.forEach((item) => {
          const show = cat === 'all' || item.dataset.cats.split(' ').includes(cat);
          item.classList.toggle('hidden', !show);
        });
      });
    });
  }

  /* ---------- back to top ---------- */
  const toTop = document.querySelector('.to-top');
  if (toTop) {
    const onScroll = () => toTop.classList.toggle('show', window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- auto year ---------- */
  document.querySelectorAll('.js-year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- long-form doc: scroll-spy index + progress ---------- */
  const bar = document.querySelector('.progress-bar');
  if (bar) {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const index = document.querySelector('.doc-index');
  if (index) {
    const links = index.querySelectorAll('a[href^="#"]');
    const sections = Array.from(links).map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);

    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) {
          const id = '#' + visible[0].target.id;
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === id));
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));

    links.forEach((l) => {
      l.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(l.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- accordion rows + nested panels: click to pin open ---------- */
  const initAccordion = (sel) => {
    const items = document.querySelectorAll(sel);
    if (!items.length) return;

    items.forEach((item) => {
      const head = item.querySelector('.acc-head, .panel-head');
      if (!head) return;

      const closeSiblings = () => {
        const scope = item.parentElement;
        if (!scope) return;
        scope.querySelectorAll(sel).forEach((sib) => {
          if (sib !== item && sib.classList.contains('open')) {
            sib.classList.remove('open');
            const h = sib.querySelector('.acc-head, .panel-head');
            if (h) h.setAttribute('aria-expanded', 'false');
          }
        });
      };

      head.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        closeSiblings();
        if (!isOpen) {
          item.classList.add('open');
          head.setAttribute('aria-expanded', 'true');
        } else {
          item.classList.remove('open');
          head.setAttribute('aria-expanded', 'false');
        }
      });

      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          head.click();
        }
      });
    });
  };

  initAccordion('.acc-row');
  initAccordion('.panel');

  /* timeline page: hovering/focusing a left-side era swaps the right-side card.
     Hover never expands anything in place â€” only the stage content changes. */
  const initEraHover = () => {
    const eras = document.querySelectorAll('.era');
    const stage = document.querySelector('.era-stage');
    if (!eras.length || !stage) return;
    const cards = stage.querySelectorAll('.era-card');
    if (!cards.length) return;

    const activate = (el) => {
      if (!el) return;
      eras.forEach((e) => {
        e.classList.toggle('active', e === el);
        e.setAttribute('aria-selected', e === el ? 'true' : 'false');
      });
      cards.forEach((c) => {
        const on = c.dataset.era === el.dataset.era;
        c.classList.toggle('active', on);
        c.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (stage.scrollTop) stage.scrollTop = 0;
    };

    eras.forEach((el) => {
      el.addEventListener('mouseenter', () => activate(el));
      el.addEventListener('focus', () => activate(el));
      el.addEventListener('click', () => activate(el));
    });

    activate(document.querySelector('.era.active') || eras[0]);
  };

  initEraHover();

/* timeline rail: country colours (green=BD, blue=UK, pink=USA) as segments
      on the left line. Pure decoration - never intercepts pointer events. */
  const initEraRail = () => {
    const col = document.querySelector('.era-col');
    const eras = [...document.querySelectorAll('.era')];
    if (!col || !eras.length) return;

    const ERA_COUNTRY = {
      sscl: 'uk', ifpri: 'uk', peb: 'bd', brac: 'bd',
      umpl: 'uk', diss: 'uk', shestem: 'bd', dfs: 'bd', briefs: 'bd', draftesia: 'bd',
      lse: 'uk', ucd: 'usa', esiacert: 'bd', teach: 'usa',
      esia: 'bd', merit: 'uk', london: 'uk', grad: 'usa', davis: 'usa',
      california: 'usa', school: 'bd', born: 'bd'
    };
    const COLORS = { bd: '#16803C', uk: '#1D4ED8', usa: '#E83E8C' };

    eras.forEach((e) => {
      const c = ERA_COUNTRY[e.dataset.era];
      if (c) e.dataset.country = c;
    });

    const draw = () => {
      col.querySelectorAll('.era-seg').forEach((s) => s.remove());
      if (window.matchMedia('(max-width: 900px)').matches) return;
      const centers = eras.map((e) => e.offsetTop + e.offsetHeight / 2);
      const top = eras[0].offsetTop;
      const bottom = eras[eras.length - 1].offsetTop + eras[eras.length - 1].offsetHeight;
      const mk = (t, h, color) => {
        const d = document.createElement('div');
        d.className = 'era-seg';
        d.style.top = `${t}px`;
        d.style.height = `${h}px`;
        d.style.background = color;
        col.appendChild(d);
      };
      mk(top, bottom - top, '#E3E3E3');
      for (let i = 0; i < eras.length - 1; i++) {
        const c = COLORS[eras[i].dataset.country];
        if (c) mk(centers[i], centers[i + 1] - centers[i], c);
      }
    };

    draw();
    window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  };

  initEraRail();

  /* landing rail: static country-coloured line (green=BD, blue=UK, pink=USA).
     Pure decoration — no hover logic, no scroll-spy, no pointer interaction. */
  const initLandingRail = () => {
    const track = document.querySelector('.life-rail-track');
    const items = track ? Array.from(track.querySelectorAll('.tl-item')) : [];
    if (!track || !items.length) return;

    const COLORS = { bd: '#16803C', uk: '#1D4ED8', usa: '#E83E8C' };

    const draw = () => {
      track.querySelectorAll('.tl-seg').forEach((s) => s.remove());
      if (window.matchMedia('(max-width: 980px)').matches) return;
      const centers = items.map((e) => e.offsetTop + e.offsetHeight / 2);
      const top = items[0].offsetTop;
      const bottom = items[items.length - 1].offsetTop + items[items.length - 1].offsetHeight;
      const mk = (t, h, color) => {
        const d = document.createElement('div');
        d.className = 'tl-seg';
        d.style.top = `${t}px`;
        d.style.height = `${h}px`;
        d.style.background = color;
        track.appendChild(d);
      };
      mk(top, bottom - top, '#E3E3E3');
      for (let i = 0; i < items.length - 1; i++) {
        const c = COLORS[items[i].dataset.country];
        if (c) mk(centers[i], centers[i + 1] - centers[i], c);
      }
    };

    draw();
    window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  };

  initLandingRail();

  /* left-to-right mirror: hovering a CV panel lights up its timeline chapter.
     The rail itself stays inert - no listeners on .tl-item. */
  const initPanelToRail = () => {
    const rail = document.querySelector('.life-rail');
    const track = document.querySelector('.life-rail-track');
    const items = track ? [...track.querySelectorAll('.tl-item[data-tl]')] : [];
    const panels = [
      ...document.querySelectorAll('.doc-hero[data-tl], .doc-body [data-tl]')
    ];
    if (!rail || !track || !items.length || !panels.length) return;

    const byKey = new Map(items.map((i) => [i.dataset.tl, i]));

    const reveal = (item) => {
      const y = track.offsetTop + item.offsetTop;
      const vh = rail.clientHeight;
      if (y < rail.scrollTop + 8 || y + item.offsetHeight > rail.scrollTop + vh - 8) {
        rail.scrollTop = y - (vh - item.offsetHeight) / 2;
      }
    };

    panels.forEach((p) => {
      p.addEventListener('mouseenter', () => {
        const item = byKey.get(p.dataset.tl);
        if (!item) return;
        items.forEach((i) => i.classList.remove('active'));
        item.classList.add('active');
        reveal(item);
      });
      p.addEventListener('mouseleave', () => {
        const item = byKey.get(p.dataset.tl);
        if (item) item.classList.remove('active');
      });
    });
  };

  initPanelToRail();

  /* un-collapse the main sections by default; sub-sections stay collapsed */
  document.querySelectorAll('.acc-row').forEach((item) => {
    item.classList.add('open');
    const h = item.querySelector('.acc-head');
    if (h) h.setAttribute('aria-expanded', 'true');
  });

  /* index click: scroll AND expand the target section */
  document.querySelectorAll('.doc-index a[href^="#"]').forEach((l) => {
    l.addEventListener('click', () => {
      const target = document.querySelector(l.getAttribute('href'));
      if (target && target.classList.contains('acc-row')) {
        target.parentElement.querySelectorAll('.acc-row').forEach((r) => {
          if (r !== target && r.classList.contains('open')) {
            r.classList.remove('open');
            const h = r.querySelector('.acc-head');
            if (h) h.setAttribute('aria-expanded', 'false');
          }
        });
        target.classList.add('open');
        const head = target.querySelector('.acc-head');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
    });
});

});
