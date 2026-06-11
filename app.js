(function () {
  'use strict';

  var html = document.documentElement;

  // --- Dark/light mode toggle ---
  var themeToggle = document.getElementById('theme-toggle');
  var themeColorMeta = document.querySelector('meta[name="theme-color"]');

  function setThemeColor(isDark) {
    themeColorMeta.setAttribute('content', isDark ? '#020617' : '#f8fafc');
  }

  setThemeColor(html.classList.contains('dark'));
  themeToggle.setAttribute('aria-pressed', String(html.classList.contains('dark')));
  themeToggle.addEventListener('click', function () {
    var isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.setAttribute('aria-pressed', String(isDark));
    setThemeColor(isDark);
  });

  // --- Mobile menu toggle ---
  var menuToggle = document.getElementById('mobile-menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  var menuOpenIcon = document.getElementById('icon-menu-open');
  var menuCloseIcon = document.getElementById('icon-menu-close');

  function setMenuOpen(isOpen) {
    mobileMenu.classList.toggle('hidden', !isOpen);
    menuOpenIcon.classList.toggle('hidden', isOpen);
    menuCloseIcon.classList.toggle('hidden', !isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  }

  menuToggle.addEventListener('click', function () {
    setMenuOpen(mobileMenu.classList.contains('hidden'));
  });

  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      setMenuOpen(false);
    });
  });

  // --- Project detail modal ---
  var projectModal = document.getElementById('project-modal');
  var projectModalClose = document.getElementById('project-modal-close');
  var projectModalImage = document.getElementById('project-modal-image');
  var projectModalTitle = document.getElementById('project-modal-title');
  var projectModalTagline = document.getElementById('project-modal-tagline');
  var projectModalLink = document.getElementById('project-modal-link');
  var projectModalTags = document.getElementById('project-modal-tags');
  var projectModalProblem = document.getElementById('project-modal-problem');
  var projectModalSolution = document.getElementById('project-modal-solution');
  var projectModalResult = document.getElementById('project-modal-result');
  var projectModalLastFocused = null;

  function openProjectModal(project, triggerEl) {
    projectModalLastFocused = triggerEl || document.activeElement;

    projectModalImage.setAttribute('src', project.image);
    projectModalImage.setAttribute('alt', project.name + ' website screenshot');
    projectModalTitle.textContent = project.name;
    projectModalTagline.textContent = project.tagline;
    projectModalLink.setAttribute('href', project.url);
    projectModalProblem.textContent = project.problem;
    projectModalSolution.textContent = project.solution;
    projectModalResult.textContent = project.result;

    var tagTpl = document.getElementById('tag-item-template');
    projectModalTags.innerHTML = '';
    (project.tags || []).forEach(function (tag) {
      var li = tagTpl.content.cloneNode(true);
      li.querySelector('li').textContent = tag;
      projectModalTags.appendChild(li);
    });

    projectModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    projectModalClose.focus();
    document.addEventListener('keydown', onProjectModalKeydown);
  }

  function closeProjectModal() {
    projectModal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', onProjectModalKeydown);
    if (projectModalLastFocused) projectModalLastFocused.focus();
  }

  function onProjectModalKeydown(event) {
    if (event.key === 'Escape') {
      closeProjectModal();
      return;
    }
    if (event.key === 'Tab') {
      var focusable = projectModal.querySelectorAll('a[href], button:not([disabled])');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  projectModalClose.addEventListener('click', closeProjectModal);
  projectModal.querySelector('[data-modal-dismiss]').addEventListener('click', closeProjectModal);

  // --- Footer year ---
  document.getElementById('year').textContent = new Date().getFullYear();

  // --- Load content and render the requested persona ---
  fetch('content.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var params = new URLSearchParams(window.location.search);
      var requested = params.get('profile');
      var content = (data.personas && data.personas[requested]) || data.personas.general;

      applyMeta(content.meta);
      applyText(content);
      applyHrefs(content);
      renderSkills(content.skills);
      renderExperience(content.experience);
      renderProjects(content.projects);
    })
    .catch(function (err) {
      console.error('Failed to load content.json', err);
      var main = document.getElementById('main');
      var notice = document.createElement('p');
      notice.className = 'mx-auto max-w-5xl px-4 py-8 text-red-600 dark:text-red-400';
      notice.textContent = 'Could not load content.json. If you opened this file directly from disk, serve the folder with a local web server (e.g. "python3 -m http.server") and reload.';
      main.prepend(notice);
    });

  function getByPath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function setMetaContent(selector, value) {
    var tag = document.querySelector(selector);
    if (tag) tag.setAttribute('content', value);
  }

  function applyMeta(meta) {
    if (!meta) return;
    if (meta.title) {
      document.title = meta.title;
      setMetaContent('meta[property="og:title"]', meta.title);
      setMetaContent('meta[name="twitter:title"]', meta.title);
    }
    if (meta.description) {
      setMetaContent('meta[name="description"]', meta.description);
      setMetaContent('meta[property="og:description"]', meta.description);
      setMetaContent('meta[name="twitter:description"]', meta.description);
    }
  }

  function applyText(content) {
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var value = getByPath(content, el.getAttribute('data-bind'));
      if (value !== undefined) el.textContent = value;
    });
  }

  function applyHrefs(content) {
    document.querySelectorAll('[data-bind-href]').forEach(function (el) {
      var value = getByPath(content, el.getAttribute('data-bind-href'));
      if (value === undefined) return;
      var isMailto = el.getAttribute('data-bind-mailto') === 'true';
      var isTel = el.getAttribute('data-bind-tel') === 'true';
      if (isMailto) {
        el.setAttribute('href', 'mailto:' + value);
      } else if (isTel) {
        el.setAttribute('href', 'tel:' + value.replace(/[^+\d]/g, ''));
      } else {
        el.setAttribute('href', value);
      }
    });
  }

  function renderSkills(skills) {
    var grid = document.getElementById('skills-grid');
    var categoryTpl = document.getElementById('skill-category-template');
    var itemTpl = document.getElementById('skill-item-template');
    grid.innerHTML = '';
    (skills && skills.categories || []).forEach(function (category) {
      var node = categoryTpl.content.cloneNode(true);
      node.querySelector('[data-field="name"]').textContent = category.name;
      var list = node.querySelector('[data-field="items"]');
      (category.items || []).forEach(function (item) {
        var li = itemTpl.content.cloneNode(true);
        li.querySelector('li').textContent = item;
        list.appendChild(li);
      });
      grid.appendChild(node);
    });
  }

  function renderExperience(experience) {
    var list = document.getElementById('experience-list');
    var itemTpl = document.getElementById('experience-item-template');
    var bulletTpl = document.getElementById('bullet-item-template');
    list.innerHTML = '';
    (experience || []).forEach(function (entry) {
      var node = itemTpl.content.cloneNode(true);
      node.querySelector('[data-field="role"]').textContent = entry.role;
      node.querySelector('[data-field="period"]').textContent = entry.period;
      node.querySelector('[data-field="type"]').textContent = entry.type;
      var bullets = node.querySelector('[data-field="bullets"]');
      (entry.bullets || []).forEach(function (bullet) {
        var li = bulletTpl.content.cloneNode(true);
        li.querySelector('li').textContent = bullet;
        bullets.appendChild(li);
      });
      list.appendChild(node);
    });
  }

  function renderProjects(projects) {
    var list = document.getElementById('projects-list');
    var itemTpl = document.getElementById('project-item-template');
    list.innerHTML = '';
    (projects || []).forEach(function (project) {
      var node = itemTpl.content.cloneNode(true);
      var image = node.querySelector('[data-field="image"]');
      image.setAttribute('src', project.image);
      image.setAttribute('alt', project.name + ' website screenshot');
      node.querySelector('[data-field="name"]').textContent = project.name;
      node.querySelector('[data-field="tagline"]').textContent = project.tagline;
      var trigger = node.querySelector('[data-field="trigger"]');
      trigger.addEventListener('click', function () {
        openProjectModal(project, trigger);
      });
      list.appendChild(node);
    });
  }
})();
