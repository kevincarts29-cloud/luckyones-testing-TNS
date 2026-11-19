// TechNova Solutions - site scripts

// Mobile nav toggle
(function () {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('navMenu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close the menu when a link is tapped
    menu.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
})();

// In-page anchor links
document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Forms: show inline confirmation instead of a blocking alert
document.querySelectorAll('form[data-notify]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const note = form.querySelector('[data-form-note]');
        const data = Object.fromEntries(new FormData(form).entries());
        const name = (data.name || '').toString().trim();

        if (note) {
            note.textContent = 'Thanks' + (name ? ', ' + name : '') +
                '. Your message is with us and we will reply within one business day.';
            note.hidden = false;
        }

        form.reset();
    });
});

// Consent gate - homepage only. Content stays locked until accepted.
(function () {
    const KEY = 'technova.consent';

    const path = window.location.pathname;
    const isHome = path === '/' || /(^|\/)index\.html?$/.test(path);
    if (!isHome) return;

    const dialog = document.querySelector('[data-gate]');
    const banner = document.querySelector('[data-gate-banner]');
    if (!dialog || !banner) return;

    const reopenBtns = document.querySelectorAll('[data-gate-open]');
    let returnFocusTo = null;

    function read(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (err) {
            return null;
        }
    }

    function write(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (err) {
            // Private browsing: stay gated for this page view only.
        }
    }

    function remove(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (err) {
            // Nothing to clean up.
        }
    }

    function focusables(scope) {
        return scope.querySelectorAll('button, a[href]');
    }

    function show(scope) {
        dialog.hidden = true;
        banner.hidden = true;
        scope.hidden = false;
        document.body.classList.add('gate-locked');
        document.addEventListener('keydown', onKeydown, true);

        // Land on the primary action rather than the first link in the panel.
        const primary = scope.querySelector('[data-accept]');
        const items = focusables(scope);
        if (primary) primary.focus();
        else if (items.length) items[0].focus();
    }

    function hide() {
        dialog.hidden = true;
        banner.hidden = true;
        document.body.classList.remove('gate-locked');
        document.removeEventListener('keydown', onKeydown, true);

        if (returnFocusTo && returnFocusTo.focus) {
            returnFocusTo.focus();
        }
    }

    function accept() {
        write(KEY, 'accepted');
        hide();
    }

    function decline() {
        show(banner);
    }

    // Trap Tab inside whichever panel is open, and treat Esc as "not yet".
    function onKeydown(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            decline();
            return;
        }

        if (e.key !== 'Tab') return;

        const scope = dialog.hidden ? banner : dialog;
        if (scope.hidden) return;

        const items = focusables(scope);
        if (!items.length) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    dialog.querySelectorAll('[data-accept]').forEach(function (btn) {
        btn.addEventListener('click', accept);
    });

    dialog.querySelectorAll('[data-decline]').forEach(function (btn) {
        btn.addEventListener('click', decline);
    });

    banner.querySelectorAll('[data-accept]').forEach(function (btn) {
        btn.addEventListener('click', accept);
    });

    banner.querySelectorAll('[data-leave]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            remove(KEY);
            window.location.href = 'https://www.google.com';
        });
    });

    // Clicking the scrim itself is a decline, not an accept.
    [dialog, banner].forEach(function (scrim) {
        scrim.addEventListener('mousedown', function (e) {
            if (e.target === scrim) decline();
        });
    });

    // Footer link so an accepted visitor can withdraw consent.
    reopenBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            returnFocusTo = btn;
            show(dialog);
        });
    });

    if (read(KEY) === 'accepted') {
        hide();
    } else {
        returnFocusTo = document.activeElement;
        show(dialog);
    }
})();