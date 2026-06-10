/* ============================================================
   DRIPP IV — App Interactions & Scroll Animations
   ============================================================ */

(function () {

  /* ── Loader ── */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('done');
      initHeroReveal();
    }, 1600);
  });

  /* ── Hero text stagger ── */
  function initHeroReveal() {
    const eyebrow = document.querySelector('.hero-eyebrow');
    const words   = document.querySelectorAll('.hero-word');
    const sub     = document.querySelector('.hero-sub');
    const cta     = document.querySelector('.hero-cta');

    if (eyebrow) {
      eyebrow.style.animation = 'fadeUp 0.6s 0s cubic-bezier(0,0,0.2,1) forwards';
    }
    words.forEach((w, i) => {
      w.style.transition = `opacity 0.7s ${0.1 + i * 0.12}s cubic-bezier(0,0,0.2,1),
                            transform 0.7s ${0.1 + i * 0.12}s cubic-bezier(0,0,0.2,1)`;
      requestAnimationFrame(() => {
        w.style.opacity   = '1';
        w.style.transform = 'translateY(0)';
      });
    });
    if (sub) {
      sub.style.transition = 'opacity 0.7s 0.55s cubic-bezier(0,0,0.2,1), transform 0.7s 0.55s cubic-bezier(0,0,0.2,1)';
      requestAnimationFrame(() => { sub.style.opacity = '1'; sub.style.transform = 'translateY(0)'; });
    }
    if (cta) {
      cta.style.transition = 'opacity 0.7s 0.72s cubic-bezier(0,0,0.2,1), transform 0.7s 0.72s cubic-bezier(0,0,0.2,1)';
      requestAnimationFrame(() => { cta.style.opacity = '1'; cta.style.transform = 'translateY(0)'; });
    }
  }

  /* ── Navigation ── */
  const nav = document.getElementById('nav');
  const menuBtn  = document.querySelector('.nav-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  let menuOpen = false;

  window.addEventListener('scroll', () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      menuOpen = !menuOpen;
      mobileMenu.classList.toggle('open', menuOpen);
      const spans = menuBtn.querySelectorAll('span');
      if (menuOpen) {
        spans[0].style.transform = 'translateY(6px) rotate(45deg)';
        spans[1].style.transform = 'translateY(-1px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.transform = '';
      }
    });

    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menuOpen = false;
        mobileMenu.classList.remove('open');
        menuBtn.querySelectorAll('span').forEach(s => s.style.transform = '');
      });
    });
  }

  /* ── Custom Cursor ── */
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (dot && ring && window.matchMedia('(pointer: fine)').matches) {
    let rx = -100, ry = -100; // ring position (lagged)
    let tx = -100, ty = -100; // target (mouse)

    document.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.left = tx + 'px';
      dot.style.top  = ty + 'px';
    });

    // Smooth ring follow
    function trackRing() {
      rx += (tx - rx) * 0.14;
      ry += (ty - ry) * 0.14;
      ring.style.left = rx + 'px';
      ring.style.top  = ry + 'px';
      requestAnimationFrame(trackRing);
    }
    trackRing();

    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    });
  }

  /* ── Generic IntersectionObserver reveal ── */
  function observe(selector, animate, threshold = 0.15) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold });

    els.forEach(el => io.observe(el));
  }

  /* ── Statement word-by-word reveal (scroll scrub) ── */
  function initStatement() {
    const section = document.getElementById('statement');
    if (!section) return;
    const words = section.querySelectorAll('.word');
    if (!words.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        // Stagger each word: start dim, scroll through lights them up
        const DELAY_PER_WORD = 60; // ms between words
        words.forEach((w, i) => {
          setTimeout(() => {
            w.style.transition = 'color 0.5s ease';
            w.classList.remove('dim');
          }, i * DELAY_PER_WORD);
        });
      });
    }, { threshold: 0.3 });

    io.observe(section);
  }
  initStatement();

  /* ── Service cards stagger ── */
  observe('.service-card', (el) => {
    const delay = parseInt(el.dataset.delay || 0);
    el.style.transition = `opacity 0.6s ${delay}ms cubic-bezier(0,0,0.2,1),
                           transform 0.6s ${delay}ms cubic-bezier(0,0,0.2,1)`;
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
  }, 0.05);

  /* ── Location cards stagger ── */
  function initLocations() {
    const cards = document.querySelectorAll('.location-card');
    if (!cards.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        cards.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.55s cubic-bezier(0,0,0.2,1), transform 0.55s cubic-bezier(0,0,0.2,1)';
            c.style.opacity   = '1';
            c.style.transform = 'translateY(0)';
          }, i * 80);
        });
      });
    }, { threshold: 0.1 });

    const section = document.getElementById('locations');
    if (section) io.observe(section);
  }
  initLocations();

  /* ── Pricing cards stagger ── */
  function initPricing() {
    const cards = document.querySelectorAll('.pricing-card');
    if (!cards.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        cards.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.6s cubic-bezier(0,0,0.2,1), transform 0.6s cubic-bezier(0,0,0.2,1)';
            c.style.opacity   = '1';
            c.style.transform = 'translateY(0)';
          }, i * 100);
        });
      });
    }, { threshold: 0.1 });

    const section = document.getElementById('membership');
    if (section) io.observe(section);
  }
  initPricing();

  /* ── Why cards stagger ── */
  function initWhy() {
    const cards = document.querySelectorAll('.why-card');
    if (!cards.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        cards.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.6s cubic-bezier(0,0,0.2,1), transform 0.6s cubic-bezier(0,0,0.2,1)';
            c.style.opacity = '1'; c.style.transform = 'translateY(0)';
          }, i * 90);
        });
      });
    }, { threshold: 0.1 });
    const s = document.getElementById('why'); if (s) io.observe(s);
  }
  initWhy();

  /* ── Lab cards stagger ── */
  function initLab() {
    const cards = document.querySelectorAll('.lab-card');
    if (!cards.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        cards.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.6s cubic-bezier(0,0,0.2,1), transform 0.6s cubic-bezier(0,0,0.2,1)';
            c.style.opacity = '1'; c.style.transform = 'translateY(0)';
          }, i * 90);
        });
      });
    }, { threshold: 0.1 });
    const s = document.getElementById('lab'); if (s) io.observe(s);
  }
  initLab();

  /* ── Membership visual + tiers ── */
  observe('.membership-visual', el => {
    el.style.transition = 'opacity 0.7s cubic-bezier(0,0,0.2,1), transform 0.7s cubic-bezier(0,0,0.2,1)';
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
  }, 0.1);

  /* ── Gift section ── */
  observe('.gift-text', el => {
    el.style.transition = 'opacity 0.7s cubic-bezier(0,0,0.2,1), transform 0.7s cubic-bezier(0,0,0.2,1)';
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
  }, 0.1);
  observe('.gift-images', el => {
    el.style.transition = 'opacity 0.8s 0.15s cubic-bezier(0,0,0.2,1), transform 0.8s 0.15s cubic-bezier(0,0,0.2,1)';
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
  }, 0.1);

  /* ── de-liver-ance ── */
  observe('.deliver-img', el => {
    el.style.transition = 'opacity 0.8s cubic-bezier(0,0,0.2,1), transform 0.8s cubic-bezier(0,0,0.2,1)';
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
  }, 0.1);
  observe('.deliver-text', el => {
    el.style.transition = 'opacity 0.7s 0.1s cubic-bezier(0,0,0.2,1), transform 0.7s 0.1s cubic-bezier(0,0,0.2,1)';
    el.style.opacity = '1'; el.style.transform = 'translateY(0)';
  }, 0.1);

  /* ── Product cards stagger ── */
  function initProducts() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        cards.forEach((c, i) => {
          setTimeout(() => {
            c.style.transition = 'opacity 0.6s cubic-bezier(0,0,0.2,1), transform 0.6s cubic-bezier(0,0,0.2,1)';
            c.style.opacity   = '1';
            c.style.transform = 'translateY(0)';
          }, i * 100);
        });
      });
    }, { threshold: 0.1 });
    const section = document.getElementById('products');
    if (section) io.observe(section);
  }
  initProducts();

  /* ── Testimonials slide in ── */
  observe('.testimonials-track', (el) => {
    el.style.transition = 'opacity 0.8s cubic-bezier(0,0,0.2,1), transform 0.8s cubic-bezier(0,0,0.2,1)';
    el.style.opacity   = '1';
    el.style.transform = 'translateX(0)';
  }, 0.1);

  /* ── App section ── */
  observe('.app-text', (el) => {
    el.style.transition = 'opacity 0.7s cubic-bezier(0,0,0.2,1), transform 0.7s cubic-bezier(0,0,0.2,1)';
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
  }, 0.1);

  observe('.app-visual', (el) => {
    el.style.transition = 'opacity 0.8s 0.15s cubic-bezier(0,0,0.2,1), transform 0.8s 0.15s cubic-bezier(0,0,0.2,1)';
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
  }, 0.1);

  /* ── CTA section ── */
  observe('.cta-inner', (el) => {
    el.style.transition = 'opacity 0.8s cubic-bezier(0,0,0.2,1), transform 0.8s cubic-bezier(0,0,0.2,1)';
    el.style.opacity   = '1';
    el.style.transform = 'translateY(0)';
  }, 0.2);

  /* ── Section headers ── */
  observe('.section-header', (el) => {
    el.querySelectorAll('.section-label, .section-title').forEach((child, i) => {
      child.style.opacity   = '0';
      child.style.transform = 'translateY(20px)';
      child.style.transition = `opacity 0.6s ${i * 0.12}s cubic-bezier(0,0,0.2,1),
                                 transform 0.6s ${i * 0.12}s cubic-bezier(0,0,0.2,1)`;
      requestAnimationFrame(() => {
        child.style.opacity   = '1';
        child.style.transform = 'translateY(0)';
      });
    });
  }, 0.15);

  /* ── Stats counter ── */
  function animateCount(el, target, duration = 1400) {
    const start  = performance.now();
    const update = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out expo
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  function initStats() {
    const counters = document.querySelectorAll('.count');
    if (!counters.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const target = parseInt(entry.target.dataset.target, 10);
        animateCount(entry.target, target);
      });
    }, { threshold: 0.4 });

    counters.forEach(c => io.observe(c));
  }
  initStats();

  /* ── Team cards stagger ── */
  function initTeam() {
    const grids = document.querySelectorAll('.team-grid');
    if (!grids.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const gridCards = entry.target.querySelectorAll('.team-card');
        gridCards.forEach((c, i) => {
          setTimeout(() => { c.classList.add('revealed'); }, i * 55);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.05 });
    grids.forEach(g => io.observe(g));
  }
  initTeam();

  /* ── Smooth anchor scrolling with offset for fixed nav ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 68;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── Phone frame floating animation ── */
  (function floatPhone() {
    const phone = document.querySelector('.phone-frame');
    if (!phone) return;
    let t = 0;
    function tick() {
      t += 0.012;
      phone.style.transform = `translateY(${Math.sin(t) * 7}px) rotate(${Math.sin(t * 0.6) * 1.5}deg)`;
      requestAnimationFrame(tick);
    }
    tick();
  })();

  /* ── Parallax: stats + statement subtle depth ── */
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed  = parseFloat(el.dataset.parallax) || 0.3;
      const rect   = el.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - innerHeight / 2) * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
  }, { passive: true });

})();
