(function () {
  const body = document.body;
  const burger = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.getElementById('mobileMenu');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function toggleMenu(forcedState) {
    if (!burger || !mobileMenu) return;
    const isOpen = typeof forcedState === 'boolean'
      ? forcedState
      : !mobileMenu.classList.contains('is-open');

    mobileMenu.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    body.classList.toggle('no-scroll', isOpen);
  }

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => toggleMenu());

    document.addEventListener('click', (event) => {
      if (!mobileMenu.classList.contains('is-open')) return;
      const target = event.target;
      if (mobileMenu.contains(target) || burger.contains(target)) return;
      toggleMenu(false);
    });

    mobileMenu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 840) {
        toggleMenu(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        toggleMenu(false);
      }
    });
  }

  const revealElements = document.querySelectorAll('[data-reveal]');
  if (prefersReducedMotion.matches) {
    revealElements.forEach((element) => element.classList.add('reveal'));
  } else if (revealElements.length) {
    const intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElements.forEach((element) => intersectionObserver.observe(element));
  }

  const internalLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  internalLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetSelector = link.getAttribute('href');
      if (!targetSelector) return;

      const target = document.querySelector(targetSelector);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });

  const carousels = document.querySelectorAll('[data-carousel]');
  if (carousels.length) {
    carousels.forEach((carousel) => {
      const track = carousel.querySelector('[data-carousel-track]');
      const slides = track ? Array.from(track.children) : [];
      if (!track || !slides.length) return;

      const dotsHost = carousel.querySelector('[data-carousel-dots]');
      const prevButton = carousel.querySelector('[data-carousel-prev]');
      const nextButton = carousel.querySelector('[data-carousel-next]');
      const autoplayEnabled = !prefersReducedMotion.matches && slides.length > 1;
      const interval = Number(carousel.dataset.interval) || 5200;
      const dots = [];
      let activeIndex = 0;
      let timer = null;

      if (dotsHost) {
        dotsHost.innerHTML = '';
        slides.forEach((_, slideIndex) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'carousel-dot';
          dot.setAttribute('aria-label', `Go to slide ${slideIndex + 1}`);
          dot.dataset.carouselDot = '';
          dot.addEventListener('click', () => {
            setActive(slideIndex);
            restartAutoplay();
          });
          dotsHost.appendChild(dot);
          dots.push(dot);
        });
        if (slides.length <= 1) {
          dotsHost.style.display = 'none';
        }
      }

      function setActive(index) {
        if (!slides.length) return;
        activeIndex = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
          const isActive = slideIndex === activeIndex;
          slide.classList.toggle('is-active', isActive);
          slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });
        if (dots.length) {
          dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('is-active', dotIndex === activeIndex);
          });
        }
      }

      function goNext(step = 1) {
        setActive(activeIndex + step);
      }

      function stopAutoplay() {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }

      function startAutoplay() {
        if (!autoplayEnabled) return;
        stopAutoplay();
        timer = window.setInterval(() => {
          goNext(1);
        }, interval);
      }

      function restartAutoplay() {
        stopAutoplay();
        startAutoplay();
      }

      if (prevButton && slides.length > 1) {
        prevButton.addEventListener('click', () => {
          goNext(-1);
          restartAutoplay();
        });
      } else if (prevButton) {
        prevButton.hidden = true;
      }

      if (nextButton && slides.length > 1) {
        nextButton.addEventListener('click', () => {
          goNext(1);
          restartAutoplay();
        });
      } else if (nextButton) {
        nextButton.hidden = true;
      }

      if (!slides.length || slides.length <= 1) {
        stopAutoplay();
      }

      carousel.addEventListener('mouseenter', stopAutoplay);
      carousel.addEventListener('mouseleave', startAutoplay);
      carousel.addEventListener('focusin', stopAutoplay);
      carousel.addEventListener('focusout', startAutoplay);

      setActive(0);
      startAutoplay();
    });
  }

  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const contactForm = document.getElementById('contactForm');
  let resetWizardProgress = null;

  function showToast(message) {
    const existingToast = document.querySelector('.form-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'form-toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    const hide = () => {
      toast.classList.remove('visible');
      toast.addEventListener(
        'transitionend',
        () => toast.remove(),
        { once: true }
      );
    };

    setTimeout(hide, 3200);

    toast.addEventListener('click', hide, { once: true });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      contactForm.reset();
      showToast('Thanks for reaching out! We will respond within 24 hours.');
      if (typeof resetWizardProgress === 'function') {
        resetWizardProgress();
      }
    });
  }

  const wizardForm = document.querySelector('[data-brief-wizard]');
  if (wizardForm) {
    const steps = Array.from(wizardForm.querySelectorAll('[data-wizard-step]'));
    const stepperItems = Array.from(wizardForm.querySelectorAll('[data-wizard-stepper]'));
    const nextButton = wizardForm.querySelector('[data-wizard-next]');
    const prevButton = wizardForm.querySelector('[data-wizard-prev]');
    const submitButton = wizardForm.querySelector('[data-wizard-submit]');
    const progressFill = wizardForm.querySelector('[data-wizard-progress]');
    const stepLabel = wizardForm.querySelector('[data-wizard-step-label]');
    const inputsToWatch = wizardForm.querySelectorAll('select, input, textarea');
    const timelineEstimate = wizardForm.querySelector('[data-estimate-timeline]');
    const budgetEstimate = wizardForm.querySelector('[data-estimate-budget]');
    const confidenceEstimate = wizardForm.querySelector('[data-estimate-confidence]');
    const noteEstimate = wizardForm.querySelector('[data-estimate-note]');
    let currentStep = 0;

    const serviceEstimates = {
      'Full Web App Development': { weeks: [12, 18], cost: [60000, 120000], squad: 'Full-stack pod + QA' },
      'Mobile App Development': { weeks: [10, 16], cost: [50000, 90000], squad: 'React Native duo + design' },
      'Python Automation': { weeks: [4, 8], cost: [15000, 35000], squad: 'Automation lead + data engineer' },
      'MERN Stack Development': { weeks: [8, 14], cost: [40000, 80000], squad: 'MERN squad + delivery lead' },
      'Product Strategy & Design': { weeks: [3, 6], cost: [12000, 30000], squad: 'Product strategist + designer' },
      'Dedicated Product Team': { weeks: [12, 24], cost: [70000, 160000], squad: 'Embedded product trio' },
      default: { weeks: [6, 12], cost: [20000, 60000], squad: 'Lean build crew' }
    };

    const budgetLabels = {
      flex: 'Let’s recommend a range',
      'under10': 'Under $10k',
      '10-25': '$10k – $25k',
      '25-50': '$25k – $50k',
      '50+': '$50k+'
    };

    function formatCurrency(value) {
      if (value >= 1000) {
        return `$${Math.round(value / 1000)}k`;
      }
      return `$${value}`;
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function updateEstimates() {
      const service = wizardForm.service?.value || '';
      const stage = wizardForm.stage?.value || 'Concept';
      const priority = wizardForm.priority?.value || 'standard';
      const budget = wizardForm.budget?.value || 'flex';

      const base = serviceEstimates[service] || serviceEstimates.default;
      let [minWeeks, maxWeeks] = base.weeks;
      let [minCost, maxCost] = base.cost;

      if (stage === 'Concept') {
        minWeeks += 1;
        maxWeeks += 2;
      } else if (stage === 'Growth') {
        minWeeks -= 1;
        maxWeeks -= 1;
      }

      if (priority === 'accelerated') {
        minWeeks -= 2;
        maxWeeks -= 2;
        minCost *= 1.15;
        maxCost *= 1.15;
      } else if (priority === 'exploratory') {
        minWeeks += 2;
        maxWeeks += 2;
      }

      minWeeks = clamp(Math.round(minWeeks), 2, 32);
      maxWeeks = clamp(Math.round(Math.max(maxWeeks, minWeeks + 1)), minWeeks + 1, 40);

      const costLabel = `${formatCurrency(Math.round(minCost / 1000) * 1000)} – ${formatCurrency(Math.round(maxCost / 1000) * 1000)}`;
      const timelineLabel = `${minWeeks}–${maxWeeks} weeks`;
      const squadLabel = base.squad;
      const note = priority === 'accelerated'
        ? 'We’ll spin up an accelerated pod and reserve extra build hours.'
        : priority === 'exploratory'
          ? 'Exploratory pace means we can co-create the runway with you.'
          : 'This plan balances discovery, build, and QA in tight loops.';

      if (timelineEstimate) timelineEstimate.textContent = `${timelineLabel} (${priority === 'accelerated' ? 'accelerated' : priority === 'exploratory' ? 'open' : 'standard'})`;
      if (budgetEstimate) budgetEstimate.textContent = budget === 'flex' ? `${costLabel} (recommendation)` : budgetLabels[budget] || costLabel;
      if (confidenceEstimate) confidenceEstimate.textContent = squadLabel;
      if (noteEstimate) noteEstimate.textContent = note;
    }

    function setStep(index) {
      currentStep = clamp(index, 0, steps.length - 1);
      steps.forEach((step, stepIndex) => {
        step.classList.toggle('is-active', stepIndex === currentStep);
      });

      if (stepperItems.length) {
        stepperItems.forEach((item, itemIndex) => {
          item.classList.toggle('is-active', itemIndex === currentStep);
        });
      }

      if (progressFill) {
        const progress = steps.length > 1 ? currentStep / (steps.length - 1) : 1;
        progressFill.style.width = `${progress * 100}%`;
      }

      if (stepLabel) {
        stepLabel.textContent = `Step ${currentStep + 1} of ${steps.length}`;
      }

      if (prevButton) {
        prevButton.disabled = currentStep === 0;
      }

      if (nextButton && submitButton) {
        if (currentStep >= steps.length - 1) {
          nextButton.hidden = true;
          submitButton.hidden = false;
        } else {
          nextButton.hidden = false;
          submitButton.hidden = true;
        }
      }
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        setStep(currentStep + 1);
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        setStep(currentStep - 1);
      });
    }

    inputsToWatch.forEach((input) => {
      input.addEventListener('input', updateEstimates);
      input.addEventListener('change', updateEstimates);
    });

    resetWizardProgress = () => {
      setStep(0);
      updateEstimates();
    };

    updateEstimates();
    setStep(0);
  }

  const planner = document.querySelector('[data-planner]');
  if (planner) {
    const optionLabels = Array.from(planner.querySelectorAll('[data-planner-option]'));
    const selectedOutput = document.querySelector('[data-planner-selected]');
    const titleField = planner.querySelector('[data-planner-title]');
    const descriptionField = planner.querySelector('[data-planner-description]');
    const servicesField = planner.querySelector('[data-planner-services]');
    const timelineField = planner.querySelector('[data-planner-timeline]');
    const planField = planner.querySelector('[data-planner-plan]');
    const noteField = planner.querySelector('[data-planner-note]');

    const recipes = [
      {
        id: 'launch-fast',
        matches: ['fast-launch', 'strategy'],
        title: 'Launchpad sprint team',
        description: 'Run a dual-track discovery + build sprint to validate your product story while the engineering pod prepares releases.',
        services: ['Product strategy & UX research', 'Full-stack development pod', 'QA + automation lane'],
        timeline: '6–8 weeks',
        plan: 'Week 1: strategy sprint · Week 2-3: design + architecture · Week 4+: release pilots.',
        note: 'Perfect for MVPs heading into fundraising or early market validation.'
      },
      {
        id: 'experience-refresh',
        matches: ['design-refresh'],
        title: 'Experience refresh crew',
        description: 'A design systems duo plus motion + front-end support to overhaul flows without interrupting current users.',
        services: ['UI/UX design system build', 'Front-end implementation squad'],
        timeline: '4–6 weeks',
        plan: 'Week 1: audits & tokens · Week 2-3: component library · Week 4+: handoff & QA.',
        note: 'Ideal when product-market fit is proven but the interface needs a lift.'
      },
      {
        id: 'automation',
        matches: ['automation'],
        title: 'Automation pod',
        description: 'Data engineer + Python lead craft scrapers, ETL, and ops dashboards with alerting wired in.',
        services: ['Python automation', 'Data engineering', 'Ops dashboards'],
        timeline: '3–5 weeks',
        plan: 'Week 1: process mapping · Week 2: pipeline build · Week 3+: shipment & enablement.',
        note: 'Great for revenue teams and ops leads who need more leverage.'
      },
      {
        id: 'scale',
        matches: ['scale'],
        title: 'Scale squad',
        description: 'Dedicated engineering core focuses on performance budgets, observability, and microservice readiness.',
        services: ['Architecture & DevOps', 'Performance tuning', 'Monitoring & alerting'],
        timeline: '8–10 weeks',
        plan: 'Week 1-2: audit · Week 3-6: refactors, infra, CI · Week 7+: rollout with telemetry.',
        note: 'Best when traffic is spiking or you’re preparing for enterprise customers.'
      },
      {
        id: 'product-team',
        matches: ['product-team'],
        title: 'Dedicated product pod',
        description: 'A long-running trio (PM + design + engineering lead) co-builds roadmap items with your internal stakeholders.',
        services: ['Product management', 'Design lead', 'Engineering lead + crew'],
        timeline: '12+ weeks',
        plan: 'Two-week sprints with demos, async notes, and ops check-ins.',
        note: 'Drop-in pod for startups needing bandwidth without full-time hires.'
      },
      {
        id: 'strategy',
        matches: ['strategy'],
        title: 'Product clarity workshop',
        description: 'Rapid research, jobs-to-be-done mapping, and roadmap sequencing to align execs and delivery.',
        services: ['Research sprint', 'Storytelling deck', 'Roadmap + KPI board'],
        timeline: '2–3 weeks',
        plan: 'Day 1: kickoff · Week 1: interviews & research · Week 2: storytelling + roadmap.',
        note: 'Use this when you need confidence before investing heavily in build.'
      }
    ];

    const defaultRecipe = {
      title: 'Full-cycle product squad',
      description: 'Start with discovery to align KPIs, then run dual-track design + build sprints with QA baked in.',
      services: ['Product strategy & UX research', 'Full-stack development pod', 'QA + automation lane'],
      timeline: '8–12 weeks',
      plan: 'Week 1: discovery sprint · Week 2-4: design + architecture · Week 5+: build & release.',
      note: 'Lock in this plan and we’ll respond with a tailored squad roster in one business day.'
    };

    function findRecipe(selected) {
      if (!selected.length) return defaultRecipe;
      let best = defaultRecipe;
      let bestScore = 0;
      recipes.forEach((recipe) => {
        const score = recipe.matches.filter((match) => selected.includes(match)).length;
        if (score > bestScore) {
          best = recipe;
          bestScore = score;
        }
      });
      return best;
    }

    function updateSelectedLabel(selected) {
      if (!selectedOutput) return;
      if (!selected.length) {
        selectedOutput.textContent = 'Pick up to 3 challenges to get a tighter plan.';
        return;
      }

      const activeLabels = optionLabels
        .filter((label) => label.querySelector('input')?.checked)
        .map((label) => label.querySelector('strong')?.textContent?.trim())
        .filter(Boolean);

      selectedOutput.textContent = `Selected: ${activeLabels.join(', ')}`;
    }

    function updatePlanner() {
      const selectedValues = optionLabels
        .filter((label) => label.querySelector('input')?.checked)
        .map((label) => label.dataset.plannerOption);

      optionLabels.forEach((label) => {
        label.classList.toggle('is-active', label.querySelector('input')?.checked);
      });

      updateSelectedLabel(selectedValues);
      const recommendation = findRecipe(selectedValues);

      if (titleField) titleField.textContent = recommendation.title;
      if (descriptionField) descriptionField.textContent = recommendation.description;
      if (timelineField) timelineField.textContent = recommendation.timeline;
      if (planField) planField.textContent = recommendation.plan;
      if (noteField) noteField.textContent = recommendation.note;

      if (servicesField && Array.isArray(recommendation.services)) {
        servicesField.innerHTML = recommendation.services
          .map((service) => `<li>${service}</li>`)
          .join('');
      }
    }

    optionLabels.forEach((label) => {
      const input = label.querySelector('input');
      if (!input) return;
      input.addEventListener('change', updatePlanner);
    });

    updatePlanner();
  }

  const discoveryStorageKey = 'kaalrav-discovery-dismissed';
  const discoverySessionKey = 'kaalrav-discovery-shown';
  let discoveryPrompt;
  let discoveryShown = false;

  function isPromptSuppressed() {
    const resumeTime = Number(localStorage.getItem(discoveryStorageKey) || 0);
    if (resumeTime && Date.now() < resumeTime) {
      return true;
    }
    return sessionStorage.getItem(discoverySessionKey) === '1';
  }

  function suppressPrompt(days = 3) {
    const ms = days * 24 * 60 * 60 * 1000;
    localStorage.setItem(discoveryStorageKey, (Date.now() + ms).toString());
    sessionStorage.setItem(discoverySessionKey, '1');
  }

  function buildDiscoveryPrompt() {
    if (discoveryPrompt) return discoveryPrompt;
    discoveryPrompt = document.createElement('aside');
    discoveryPrompt.className = 'discovery-prompt';
    discoveryPrompt.setAttribute('role', 'dialog');
    discoveryPrompt.setAttribute('aria-live', 'polite');
    discoveryPrompt.innerHTML = `
      <button class="discovery-prompt-close" type="button" aria-label="Dismiss discovery call invite" data-discovery-close>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <small>Need backup?</small>
      <h4>Book a 15-min discovery call</h4>
      <p>Share your current bottleneck and we’ll map the fastest path forward with a dedicated pod lead.</p>
      <div class="discovery-prompt-actions">
        <a class="btn primary" href="start-project.html">Plan my build</a>
        <a class="btn ghost" href="contact.html">Talk to a human</a>
      </div>
    `;
    document.body.appendChild(discoveryPrompt);
    const closeButton = discoveryPrompt.querySelector('[data-discovery-close]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        hideDiscoveryPrompt(true);
      });
    }
    return discoveryPrompt;
  }

  function showDiscoveryPrompt(trigger) {
    if (discoveryShown || isPromptSuppressed()) return;
    const promptElement = buildDiscoveryPrompt();
    if (!promptElement) return;
    promptElement.classList.add('is-visible');
    discoveryShown = true;
    sessionStorage.setItem(discoverySessionKey, '1');
    document.dispatchEvent(new CustomEvent('discoveryPrompt:shown', { detail: { trigger } }));
  }

  function hideDiscoveryPrompt(persist) {
    if (!discoveryPrompt) return;
    discoveryPrompt.classList.remove('is-visible');
    if (persist) {
      suppressPrompt();
    }
  }

  function handleExitIntent(event) {
    if (event.clientY > 0) return;
    showDiscoveryPrompt('exit-intent');
    removeExitIntentListener();
  }

  function handleScrollTrigger() {
    const scrollDepth = window.scrollY + window.innerHeight;
    const threshold = document.body.scrollHeight * 0.6;
    if (scrollDepth >= threshold) {
      showDiscoveryPrompt('scroll');
      window.removeEventListener('scroll', handleScrollTrigger);
    }
  }

  function removeExitIntentListener() {
    document.removeEventListener('mouseout', handleExitIntent);
  }

  if (!isPromptSuppressed()) {
    document.addEventListener('mouseout', handleExitIntent);
    window.addEventListener('scroll', handleScrollTrigger, { passive: true });
    window.addEventListener('beforeunload', () => {
      if (discoveryPrompt?.classList.contains('is-visible')) {
        suppressPrompt();
      }
    });
  }

  class SparkRunner {
    constructor(canvas, scoreElement) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scoreElement = scoreElement;
      this.pixelRatio = window.devicePixelRatio || 1;
      this.width = 0;
      this.height = 0;

      this.agent = { x: 0, y: 0, speed: 120, heading: 0 };
      this.targets = [];
      this.activeTarget = null;
      this.trail = [];
      this.sparkles = [];
      this.lastTime = 0;
      this.score = 0;

      this.handleResize = this.handleResize.bind(this);
      this.loop = this.loop.bind(this);

      this.handleResize();
      this.populateTargets();
      this.updateScoreboard();
      window.addEventListener('resize', this.handleResize);
      requestAnimationFrame(this.loop);
    }

    handleResize() {
      const { canvas, ctx, pixelRatio } = this;
      const { clientWidth, clientHeight } = canvas;
      this.width = clientWidth;
      this.height = clientHeight;
      canvas.width = clientWidth * pixelRatio;
      canvas.height = clientHeight * pixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelRatio, pixelRatio);

      if (!this.agent.x && !this.agent.y) {
        this.agent.x = this.width / 2;
        this.agent.y = this.height / 2;
      }

      if (this.targets.length) {
        this.populateTargets();
      }
    }

    populateTargets() {
      this.targets.length = 0;
      const total = 6;
      const padding = 28;
      for (let i = 0; i < total; i += 1) {
        this.targets.push(this.randomPoint(padding));
      }
      this.chooseNextTarget();
    }

    randomPoint(padding) {
      return {
        x: padding + Math.random() * Math.max(10, this.width - padding * 2),
        y: padding + Math.random() * Math.max(10, this.height - padding * 2)
      };
    }

    chooseNextTarget() {
      if (!this.targets.length) return;
      const { agent } = this;
      let best = this.targets[0];
      let bestDistance = Infinity;
      this.targets.forEach((target) => {
        const distance = Math.hypot(target.x - agent.x, target.y - agent.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = target;
        }
      });
      this.activeTarget = best;
    }

    loop(timestamp) {
      const delta = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0;
      this.lastTime = timestamp;

      this.update(delta);
      this.draw(delta);

      requestAnimationFrame(this.loop);
    }

    update(delta) {
      if (delta === 0) return;

      const { agent, trail, sparkles } = this;
      const target = this.activeTarget;

      if (target) {
        const dx = target.x - agent.x;
        const dy = target.y - agent.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 10) {
          this.captureTarget(target);
        } else if (distance > 0.1) {
          const step = agent.speed * delta;
          const ratio = Math.min(step / distance, 1);
          agent.x += dx * ratio;
          agent.y += dy * ratio;
          agent.heading = Math.atan2(dy, dx);
        }
      }

      trail.push({ x: agent.x, y: agent.y, life: 1 });
      while (trail.length > 40) {
        trail.shift();
      }
      trail.forEach((node) => {
        node.life = Math.max(0, node.life - delta * 1.3);
      });

      for (let i = sparkles.length - 1; i >= 0; i -= 1) {
        const sparkle = sparkles[i];
        sparkle.life -= delta * 0.9;
        sparkle.radius += delta * 24;
        if (sparkle.life <= 0) {
          sparkles.splice(i, 1);
        }
      }
    }

    captureTarget(target) {
      this.score += 7;
      this.updateScoreboard();
      this.sparkles.push({
        x: target.x,
        y: target.y,
        radius: 6,
        life: 1
      });

      const idx = this.targets.indexOf(target);
      if (idx !== -1) {
        this.targets[idx] = this.randomPoint(24);
      }
      this.chooseNextTarget();
    }

    updateScoreboard() {
      if (this.scoreElement) {
        this.scoreElement.textContent = this.score.toString();
      }
    }

    draw() {
      const { ctx, width, height } = this;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
      gradient.addColorStop(1, 'rgba(14,116,144,0.35)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      this.drawGrid();
      this.drawTargets();
      this.drawTrail();
      this.drawAgent();
      this.drawSparkles();
    }

    drawGrid() {
      const { ctx, width, height } = this;
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 255, 0.08)';
      ctx.lineWidth = 1;
      const spacing = 32;
      for (let x = spacing / 2; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = spacing / 2; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawTargets() {
      const { ctx, targets, activeTarget } = this;
      targets.forEach((target) => {
        ctx.save();
        const isActive = target === activeTarget;
        ctx.fillStyle = isActive ? 'rgba(20,184,166,0.75)' : 'rgba(59,130,246,0.5)';
        ctx.beginPath();
        ctx.arc(target.x, target.y, isActive ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        if (isActive) {
          ctx.strokeStyle = 'rgba(20,184,166,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(target.x, target.y, 13, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    drawTrail() {
      const { ctx, trail } = this;
      ctx.save();
      trail.forEach((node, index) => {
        const opacity = (index / trail.length) * 0.5;
        ctx.fillStyle = `rgba(139,92,246,${opacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5 * node.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    drawAgent() {
      const { ctx, agent } = this;
      ctx.save();
      ctx.translate(agent.x, agent.y);
      ctx.rotate(agent.heading);

      ctx.fillStyle = 'rgba(236,72,153,0.9)';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-6, -6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(3, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawSparkles() {
      const { ctx, sparkles } = this;
      sparkles.forEach((sparkle) => {
        ctx.save();
        ctx.strokeStyle = `rgba(56,189,248,${sparkle.life})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });
    }
  }

  class OrbitGame {
    constructor(canvas, scoreElement, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.scoreElement = scoreElement;
      this.pixelRatio = window.devicePixelRatio || 1;
      this.width = 0;
      this.height = 0;

      this.hero = { x: 0, y: 0, speed: 0, heading: 0 };
      this.target = null;
      this.keys = {};
      this.pointerTarget = null;
      this.rings = [];
      this.stars = [];
      this.trail = [];
      this.lastTime = 0;
      this.score = 0;
      this.difficultyTimer = 0;
      this.mode = null;
      this.speeds = { auto: 95, manual: 130 };
      this.modeLabel = options.modeLabel || null;
      this.modeButtons = options.modeButtons ? Array.from(options.modeButtons) : [];

      this.handleResize = this.handleResize.bind(this);
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleKeyUp = this.handleKeyUp.bind(this);
      this.handlePointer = this.handlePointer.bind(this);
      this.handleBlur = this.handleBlur.bind(this);
      this.handleModeButton = this.handleModeButton.bind(this);
      this.loop = this.loop.bind(this);

      this.handleResize();
      this.initField();
      this.bindEvents();
      window.addEventListener('resize', this.handleResize);
      this.setMode('auto');
      this.updateScoreboard();
      requestAnimationFrame(this.loop);
    }

    initField() {
      const count = 38;
      for (let i = 0; i < count; i += 1) {
        this.stars.push({
          x: Math.random(),
          y: Math.random(),
          radius: Math.random() * 1.4 + 0.2,
          twinkle: Math.random() * 0.6 + 0.2
        });
      }
      this.generateRings();
    }

    bindEvents() {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      window.addEventListener('blur', this.handleBlur);
      this.canvas.addEventListener('pointerdown', this.handlePointer);
      this.modeButtons.forEach((button) => {
        button.addEventListener('click', this.handleModeButton);
      });
    }

    handleResize() {
      const { canvas, ctx, pixelRatio } = this;
      const { clientWidth, clientHeight } = canvas;
      this.width = clientWidth;
      this.height = clientHeight;
      canvas.width = clientWidth * pixelRatio;
      canvas.height = clientHeight * pixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelRatio, pixelRatio);

      if (!this.hero.x && !this.hero.y) {
        this.hero.x = this.width / 2;
        this.hero.y = this.height / 2;
      }

      if (this.rings.length) {
        this.generateRings();
      }
    }

    generateRings() {
      this.rings.length = 0;
      const ringCount = 4;
      const padding = 38;
      for (let i = 0; i < ringCount; i += 1) {
        this.rings.push(this.randomRing(padding));
      }
      this.chooseNextTarget();
    }

    handleKeyDown(event) {
      const controlKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD'
      ];
      if (controlKeys.includes(event.code)) {
        event.preventDefault();
        if (this.mode !== 'manual') {
          this.setMode('manual');
        }
        this.keys[event.code] = true;
        this.pointerTarget = null;
      }
    }

    handleKeyUp(event) {
      if (this.keys[event.code]) {
        delete this.keys[event.code];
      }
    }

    handlePointer(event) {
      if (this.mode !== 'manual') {
        this.setMode('manual');
      }
      if (this.mode !== 'manual') {
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      this.pointerTarget = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    handleBlur() {
      this.keys = {};
      this.pointerTarget = null;
    }

    isKeyActive(code) {
      return this.keys[code] ? 1 : 0;
    }

    randomRing(padding) {
      return {
        x: padding + Math.random() * (this.width - padding * 2),
        y: padding + Math.random() * (this.height - padding * 2),
        collected: false,
        pulse: Math.random() * Math.PI * 2
      };
    }

    loop(timestamp) {
      const delta = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0;
      this.lastTime = timestamp;
      this.difficultyTimer += delta;

      this.update(delta);
      this.draw(delta);

      requestAnimationFrame(this.loop);
    }

    update(delta) {
      const { hero, trail } = this;
      let moved = false;

      if (this.mode === 'manual') {
        this.target = null;
        const horizontal =
          this.isKeyActive('ArrowRight') +
          this.isKeyActive('KeyD') -
          (this.isKeyActive('ArrowLeft') + this.isKeyActive('KeyA'));
        const vertical =
          this.isKeyActive('ArrowDown') +
          this.isKeyActive('KeyS') -
          (this.isKeyActive('ArrowUp') + this.isKeyActive('KeyW'));

        if (horizontal || vertical) {
          const length = Math.hypot(horizontal, vertical) || 1;
          const step = hero.speed * delta;
          hero.x += (horizontal / length) * step;
          hero.y += (vertical / length) * step;
          hero.heading = Math.atan2(vertical, horizontal);
          moved = true;
          this.pointerTarget = null;
        } else if (this.pointerTarget) {
          const dx = this.pointerTarget.x - hero.x;
          const dy = this.pointerTarget.y - hero.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 1) {
            const step = hero.speed * delta;
            const ratio = Math.min(step / distance, 1);
            hero.x += dx * ratio;
            hero.y += dy * ratio;
            hero.heading = Math.atan2(dy, dx);
            moved = true;
          } else {
            this.pointerTarget = null;
          }
        }
      } else {
        if (!this.target || this.target.collected) {
          this.chooseNextTarget();
        }
        const target = this.target;
        if (target) {
          const dx = target.x - hero.x;
          const dy = target.y - hero.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.1) {
            const step = hero.speed * delta;
            const ratio = Math.min(step / distance, 1);
            hero.x += dx * ratio;
            hero.y += dy * ratio;
            hero.heading = Math.atan2(dy, dx);
            moved = ratio > 0;
          }
        }
      }

      if (moved) {
        const margin = 18;
        hero.x = Math.max(margin, Math.min(this.width - margin, hero.x));
        hero.y = Math.max(margin, Math.min(this.height - margin, hero.y));
      }

      trail.push({ x: hero.x, y: hero.y, life: 1 });
      while (trail.length > 60) {
        trail.shift();
      }
      trail.forEach((node) => {
        node.life = Math.max(0, node.life - delta * 0.9);
      });

      if (this.difficultyTimer > 8) {
        this.difficultyTimer = 0;
        hero.speed = Math.min(hero.speed + 8, 180);
      }

      for (let i = this.rings.length - 1; i >= 0; i -= 1) {
        const ring = this.rings[i];
        ring.pulse += delta;
        const distance = Math.hypot(ring.x - hero.x, ring.y - hero.y);
        if (distance < 20) {
          this.collectRing(ring);
        }
      }
    }

    collectRing(ring) {
      ring.collected = true;
      this.score += 15;
      this.updateScoreboard();

      const index = this.rings.indexOf(ring);
      if (index !== -1) {
        this.rings.splice(index, 1);
      }
      const padding = 32;
      this.rings.push(this.randomRing(padding));
      this.chooseNextTarget();
    }

    handleModeButton(event) {
      const mode = event.currentTarget.dataset.orbitMode;
      if (mode) {
        this.setMode(mode);
      }
    }

    setMode(mode) {
      if (!mode || (mode !== 'auto' && mode !== 'manual')) {
        return;
      }
      if (mode === this.mode) {
        this.updateModeUI();
        return;
      }
      this.mode = mode;
      this.hero.speed = this.speeds[mode] || 100;
      this.difficultyTimer = 0;
      if (mode === 'auto') {
        this.pointerTarget = null;
        this.keys = {};
        this.chooseNextTarget();
      } else {
        this.target = null;
      }
      this.updateModeUI();
    }

    updateModeUI() {
      if (this.modeLabel) {
        this.modeLabel.textContent = this.mode === 'manual' ? 'Manual pilot' : 'Auto pilot';
      }
      this.modeButtons.forEach((button) => {
        const isActive = button.dataset.orbitMode === this.mode;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    }

    chooseNextTarget() {
      if (!this.rings.length) {
        this.target = null;
        return;
      }
      const { hero } = this;
      let bestRing = null;
      let bestDistance = Infinity;
      this.rings.forEach((ring) => {
        const distance = Math.hypot(ring.x - hero.x, ring.y - hero.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestRing = ring;
        }
      });
      this.target = bestRing;
    }

    updateScoreboard() {
      if (this.scoreElement) {
        this.scoreElement.textContent = this.score.toString();
      }
    }

    draw(delta) {
      const { ctx, width, height, hero, rings, trail } = this;
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.25,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
      gradient.addColorStop(0.6, 'rgba(20,184,166,0.12)');
      gradient.addColorStop(1, 'rgba(11,16,32,0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      this.drawStars();
      this.drawOrbits();

      rings.forEach((ring) => {
        this.drawRing(ring);
      });

      this.drawTrail(trail);
      this.drawHero(hero, delta);
    }

    drawStars() {
      const { ctx, width, height, stars } = this;
      ctx.save();
      stars.forEach((star) => {
        const x = star.x * width;
        const y = star.y * height;
        const alpha = 0.4 + Math.abs(Math.sin(star.twinkle + this.lastTime * 0.0015)) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    drawOrbits() {
      const { ctx, width, height } = this;
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 255, 0.1)';
      ctx.lineWidth = 1;
      const centerX = width / 2;
      const centerY = height / 2;
      const radii = [80, 120, 160];
      radii.forEach((radius, index) => {
        ctx.beginPath();
        ctx.setLineDash([4, 6 + index * 2]);
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    drawRing(ring) {
      const { ctx } = this;
      ctx.save();
      const pulse = (Math.sin(ring.pulse * 3) + 1) * 0.5;
      const radius = 10 + pulse * 6;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 4 + pulse * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawTrail(trail) {
      const { ctx } = this;
      ctx.save();
      trail.forEach((node, index) => {
        const opacity = (index / trail.length) * 0.6;
        ctx.fillStyle = `rgba(139, 92, 246, ${opacity})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6 * node.life, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    drawHero(hero) {
      const { ctx } = this;
      ctx.save();
      ctx.translate(hero.x, hero.y);
      ctx.rotate(hero.heading);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.92)';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-10, 6);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, -6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(2, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class SystemFlowSim {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.pixelRatio = window.devicePixelRatio || 1;
      this.reduceMotion = Boolean(options.reduceMotion);
      this.width = 0;
      this.height = 0;
      this.time = 0;

      this.nodes = [
        { label: 'Signal', color: '#3b82f6' },
        { label: 'Design', color: '#a855f7' },
        { label: 'Build', color: '#14b8a6' },
        { label: 'Ops', color: '#f97316' }
      ];
      this.links = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [0, 2],
        [1, 3]
      ];
      this.packet = { from: 0, to: 1, progress: 0 };
      this.speed = 0.35;
      this.lastTime = 0;

      this.handleResize = this.handleResize.bind(this);
      this.loop = this.loop.bind(this);

      this.handleResize();
      this.draw();
      window.addEventListener('resize', this.handleResize);

      if (!this.reduceMotion) {
        requestAnimationFrame(this.loop);
      }
    }

    handleResize() {
      const { canvas, ctx, pixelRatio } = this;
      const { clientWidth, clientHeight } = canvas;
      this.width = clientWidth || 600;
      this.height = clientHeight || 260;
      canvas.width = this.width * pixelRatio;
      canvas.height = this.height * pixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(pixelRatio, pixelRatio);

      const radius = Math.max(80, Math.min(this.width, this.height) / 2 - 48);
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      this.nodes.forEach((node, index) => {
        const angle = (Math.PI * 2 * index) / this.nodes.length - Math.PI / 2;
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
        node.angle = angle;
      });

      this.draw();
    }

    loop(timestamp) {
      const delta = this.lastTime ? (timestamp - this.lastTime) / 1000 : 0;
      this.lastTime = timestamp;
      this.update(delta);
      this.draw();
      if (!this.reduceMotion) {
        requestAnimationFrame(this.loop);
      }
    }

    update(delta) {
      if (!delta) return;
      this.time += delta;
      this.packet.progress += delta * this.speed;
      if (this.packet.progress >= 1) {
        this.packet.from = this.packet.to;
        this.packet.to = (this.packet.to + 1) % this.nodes.length;
        this.packet.progress = 0;
      }
    }

    draw() {
      const { ctx, width, height } = this;
      ctx.clearRect(0, 0, width, height);
      this.drawBackground();
      this.drawLinks();
      this.drawPacketTrail();
      this.drawNodes();
      this.drawPacket();
    }

    drawBackground() {
      const { ctx, width, height } = this;
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(15,23,42,0.95)');
      gradient.addColorStop(1, 'rgba(30,27,75,0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 255, 0.08)';
      ctx.lineWidth = 1;
      const spacing = 42;
      for (let x = spacing / 2; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = spacing / 2; y < height; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawLinks() {
      const { ctx, nodes, links } = this;
      ctx.save();
      links.forEach(([fromIndex, toIndex]) => {
        const from = nodes[fromIndex];
        const to = nodes[toIndex];
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, 'rgba(59,130,246,0.4)');
        gradient.addColorStop(1, 'rgba(244,114,182,0.4)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });
      ctx.restore();
    }

    drawNodes() {
      const { ctx, nodes, time } = this;
      nodes.forEach((node, index) => {
        const pulse = 12 + Math.sin(time * 2 + index) * 3;
        ctx.save();
        ctx.strokeStyle = `${node.color}55`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulse + 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(238,242,255,0.9)';
        ctx.font = '600 0.8rem "Inter", "Segoe UI", system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + 16);
        ctx.restore();
      });
    }

    drawPacket() {
      const { ctx, nodes, packet } = this;
      const from = nodes[packet.from];
      const to = nodes[packet.to];
      if (!from || !to) return;
      const t = packet.progress;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      ctx.save();
      ctx.fillStyle = 'rgba(236,72,153,0.95)';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(236,72,153,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawPacketTrail() {
      if (this.reduceMotion) return;
      const { ctx, nodes, packet } = this;
      const steps = 24;
      ctx.save();
      for (let i = 0; i < steps; i += 1) {
        const trailT = Math.max(0, packet.progress - (i / steps));
        const from = nodes[packet.from];
        const to = nodes[packet.to];
        if (!from || !to) continue;
        const x = from.x + (to.x - from.x) * trailT;
        const y = from.y + (to.y - from.y) * trailT;
        const alpha = Math.max(0, 0.4 - i * 0.015);
        ctx.fillStyle = `rgba(236, 72, 153, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  const orbitCanvas = document.getElementById('orbitGame');
  if (orbitCanvas) {
    const gameCard = orbitCanvas.closest('.game-card');
    if (prefersReducedMotion.matches) {
      const context = orbitCanvas.getContext('2d');
      const { clientWidth, clientHeight } = orbitCanvas;
      orbitCanvas.width = clientWidth;
      orbitCanvas.height = clientHeight;
      const gradient = context.createLinearGradient(0, 0, clientWidth, clientHeight);
      gradient.addColorStop(0, 'rgba(59,130,246,0.4)');
      gradient.addColorStop(1, 'rgba(20,184,166,0.25)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, clientWidth, clientHeight);
      if (gameCard) {
        const label = gameCard.querySelector('[data-orbit-mode-label]');
        if (label) {
          label.textContent = 'Static view';
        }
        gameCard.querySelectorAll('[data-orbit-mode]').forEach((button) => {
          button.disabled = true;
          button.setAttribute('aria-pressed', 'false');
          button.classList.remove('is-active');
        });
      }
    } else {
      const score = document.getElementById('orbitScore');
      const modeButtons = gameCard ? gameCard.querySelectorAll('[data-orbit-mode]') : null;
      const modeLabel = gameCard ? gameCard.querySelector('[data-orbit-mode-label]') : null;
      new OrbitGame(orbitCanvas, score, { modeButtons, modeLabel });
    }
  }

  const sparkCanvas = document.getElementById('sparkGame');
  if (sparkCanvas) {
    if (prefersReducedMotion.matches) {
      const context = sparkCanvas.getContext('2d');
      const { clientWidth, clientHeight } = sparkCanvas;
      sparkCanvas.width = clientWidth;
      sparkCanvas.height = clientHeight;
      const gradient = context.createLinearGradient(0, 0, clientWidth, clientHeight);
      gradient.addColorStop(0, 'rgba(59,130,246,0.3)');
      gradient.addColorStop(1, 'rgba(20,184,166,0.25)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, clientWidth, clientHeight);
    } else {
      const sparkScore = document.getElementById('sparkScore');
      new SparkRunner(sparkCanvas, sparkScore);
    }
  }

  const flowCanvases = document.querySelectorAll('[data-flow-canvas]');
  if (flowCanvases.length) {
    flowCanvases.forEach((canvas) => {
      new SystemFlowSim(canvas, { reduceMotion: prefersReducedMotion.matches });
    });
  }
})();
