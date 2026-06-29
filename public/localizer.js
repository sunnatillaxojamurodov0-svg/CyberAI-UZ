/**
 * CyberAI Localizer — Production-Ready Vanilla JS Localization System
 *
 * Scrapes visible DOM text, translates via Cloudflare Worker API,
 * caches in localStorage, handles SPA mutations, prevents infinite loops,
 * and supports instant reversion to default language.
 *
 * Usage:
 *   <script src="/localizer.js"></script>
 *   <script>
 *     CyberAILocalizer.init({ targetLang: 'UZ' });
 *     CyberAILocalizer.setLanguage('RU');
 *     CyberAILocalizer.reset();
 *   </script>
 */
(function () {
  "use strict";

  // ── Constants ──────────────────────────────────────────────────────
  var API_ENDPOINT = "https://app.cyberaiuz.workers.dev";
  var DEFAULT_LANG = "EN";
  var CACHE_KEY = "cyberai_locale_cache";
  var ATTR = {
    status: "data-lang-status",
    orgText: "data-org-text",
    orgPH: "data-org-placeholder",
    orgAria: "data-org-aria",
    orgTitle: "data-org-title",
    locked: "data-lang-locked",
  };

  var SKIP_TAGS = {
    SCRIPT: 1,
    STYLE: 1,
    NOSCRIPT: 1,
    TEXTAREA: 1,
    CODE: 1,
    PRE: 1,
    KBD: 1,
    SAMP: 1,
    VAR: 1,
  };
  var EXTRA_IGNORE = "[data-no-translate],[contenteditable='true'],input[type='hidden']";

  // ── State ──────────────────────────────────────────────────────────
  var lang = DEFAULT_LANG;
  var translating = false;
  var cache = {};
  var queue = [];
  var dedupe = {}; // { text::lang -> true } prevents re-queueing same node
  var batchTimer = null;
  var abortCtrl = null;
  var observer = null;
  var onLangChange = null;

  // ── Cache persistence ──────────────────────────────────────────────
  function loadCache() {
    try {
      cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    } catch (e) {
      cache = {};
    }
  }
  function saveCache() {
    try {
      var keys = Object.keys(cache);
      if (keys.length > 2500) {
        // Evict oldest half
        var half = keys.slice(0, 1250);
        for (var i = 0; i < half.length; i++) delete cache[half[i]];
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      /* quota exceeded — reset */ cache = {};
    }
  }

  // ── Key detection ──────────────────────────────────────────────────
  // Returns TRUE if the string looks like a technical key that should
  // NOT be translated (e.g. "bento.title", "nav.console").
  function isKey(text) {
    var t = text.trim();
    if (t.length < 3) return true;
    if (/^\d+$/.test(t)) return true;
    // Pure symbols / punctuation (no letters)
    if (/^[^\w\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]+$/.test(t))
      return true;
    // Dot-separated lowercase segments: "bento.title"
    if (/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/i.test(t)) return true;
    // Underscore-separated: "login_btn"
    if (/^[a-z][a-z0-9]*(?:_[a-z][a-z0-9]*)+$/i.test(t)) return true;
    // Mixed dot/underscore without spaces, short: "auth.login_btn"
    if (/[._]/.test(t) && !/\s/.test(t) && t.length < 60) return true;
    // CSS / JS variable patterns
    if (/^(var|--|#[\w-]|\.|@)/.test(t)) return true;
    return false;
  }

  // ── API call ───────────────────────────────────────────────────────
  async function apiTranslate(text, targetLang) {
    var key = text + "::" + targetLang;
    if (cache[key]) return cache[key];

    try {
      abortCtrl = new AbortController();
      var headers = { "Content-Type": "application/json" };
      var res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ text: text, target_lang: targetLang }),
        signal: abortCtrl.signal,
      });
      if (!res.ok) throw new Error("API " + res.status);
      var data = await res.json();
      var out = data.translatedText || data.translation || data.text || text;
      cache[key] = out;
      return out;
    } catch (e) {
      if (e.name === "AbortError") return text;
      console.warn("[Localizer] API error:", e.message);
      return text;
    }
  }

  // ── Text node helpers ──────────────────────────────────────────────
  function isSkippable(el) {
    if (!el || el.nodeType !== 1) return true;
    if (SKIP_TAGS[el.tagName]) return true;
    if (el.closest && el.closest(EXTRA_IGNORE)) return true;
    return false;
  }

  function getTranslatableText(el) {
    // Direct text only (no children text)
    var text = "";
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3) text += n.textContent;
    }
    return text.trim();
  }

  // ── Translate a single element ─────────────────────────────────────
  async function translateEl(el) {
    if (el.hasAttribute(ATTR.locked)) return;
    if (el.getAttribute(ATTR.status) === lang) return;

    el.setAttribute(ATTR.locked, "1");

    try {
      // ── textContent (leaf text nodes) ──
      var directText = getTranslatableText(el);
      if (directText && !isKey(directText)) {
        if (!el.hasAttribute(ATTR.orgText)) el.setAttribute(ATTR.orgText, el.textContent);
        var translated = await apiTranslate(directText, lang);
        if (translated !== directText) {
          // Replace only direct text nodes, preserve child elements
          for (var i = 0; i < el.childNodes.length; i++) {
            var n = el.childNodes[i];
            if (n.nodeType === 3 && n.textContent.trim() === directText) {
              n.textContent = n.textContent.replace(directText, translated);
              break;
            }
          }
        }
      }

      // ── placeholder ──
      var ph = el.getAttribute("placeholder");
      if (ph && !isKey(ph)) {
        if (!el.hasAttribute(ATTR.orgPH)) el.setAttribute(ATTR.orgPH, ph);
        var tph = await apiTranslate(ph, lang);
        el.setAttribute("placeholder", tph);
      }

      // ── aria-label ──
      var al = el.getAttribute("aria-label");
      if (al && !isKey(al)) {
        if (!el.hasAttribute(ATTR.orgAria)) el.setAttribute(ATTR.orgAria, al);
        var tal = await apiTranslate(al, lang);
        el.setAttribute("aria-label", tal);
      }

      // ── title ──
      var ti = el.getAttribute("title");
      if (ti && !isKey(ti)) {
        if (!el.hasAttribute(ATTR.orgTitle)) el.setAttribute(ATTR.orgTitle, ti);
        var tti = await apiTranslate(ti, lang);
        el.setAttribute("title", tti);
      }

      el.setAttribute(ATTR.status, lang);
    } finally {
      el.removeAttribute(ATTR.locked);
    }
  }

  // ── Queue & batch processing ───────────────────────────────────────
  function enqueue(el) {
    if (!el || el.nodeType !== 1) return;
    if (isSkippable(el)) return;
    if (el.hasAttribute(ATTR.locked)) return;
    if (el.getAttribute(ATTR.status) === lang) return;

    // Dedupe: same element + same target lang → skip
    var dk =
      el.getAttribute("data-lang-uid") ||
      (el.setAttribute("data-lang-uid", Math.random().toString(36).slice(2)),
      el.getAttribute("data-lang-uid"));
    var dkKey = dk + "::" + lang;
    if (dedupe[dkKey]) return;
    dedupe[dkKey] = true;

    queue.push(el);
    debounceFlush();
  }

  function debounceFlush() {
    clearTimeout(batchTimer);
    batchTimer = setTimeout(flushQueue, 60);
  }

  async function flushQueue() {
    if (translating || queue.length === 0 || lang === DEFAULT_LANG) return;
    translating = true;

    var batch = queue.splice(0, queue.length); // take all

    // Process in parallel batches of 6
    for (var i = 0; i < batch.length; i += 6) {
      if (lang === DEFAULT_LANG) break;
      var slice = batch.slice(i, i + 6);
      await Promise.allSettled(
        slice.map(function (el) {
          return translateEl(el);
        }),
      );
    }

    saveCache();
    translating = false;

    if (queue.length > 0) flushQueue();
  }

  // ── Full page scan ─────────────────────────────────────────────────
  function scanPage() {
    if (lang === DEFAULT_LANG) return;

    // Walk all elements in body
    var all = document.body.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) {
      enqueue(all[i]);
    }
  }

  // ── Revert to EN (instant, no network) ─────────────────────────────
  function revertAll() {
    var i, el;

    // Restore textContent
    var textEls = document.querySelectorAll("[" + ATTR.orgText + "]");
    for (i = 0; i < textEls.length; i++) {
      el = textEls[i];
      el.textContent = el.getAttribute(ATTR.orgText);
      el.removeAttribute(ATTR.orgText);
    }

    // Restore placeholders
    var phEls = document.querySelectorAll("[" + ATTR.orgPH + "]");
    for (i = 0; i < phEls.length; i++) {
      el = phEls[i];
      el.setAttribute("placeholder", el.getAttribute(ATTR.orgPH));
      el.removeAttribute(ATTR.orgPH);
    }

    // Restore aria-labels
    var ariaEls = document.querySelectorAll("[" + ATTR.orgAria + "]");
    for (i = 0; i < ariaEls.length; i++) {
      el = ariaEls[i];
      el.setAttribute("aria-label", el.getAttribute(ATTR.orgAria));
      el.removeAttribute(ATTR.orgAria);
    }

    // Restore titles
    var titleEls = document.querySelectorAll("[" + ATTR.orgTitle + "]");
    for (i = 0; i < titleEls.length; i++) {
      el = titleEls[i];
      el.setAttribute("title", el.getAttribute(ATTR.orgTitle));
      el.removeAttribute(ATTR.orgTitle);
    }

    // Clean up markers
    var marked = document.querySelectorAll("[" + ATTR.status + "]");
    for (i = 0; i < marked.length; i++) {
      el = marked[i];
      el.removeAttribute(ATTR.status);
      el.removeAttribute(ATTR.locked);
      el.removeAttribute("data-lang-uid");
    }

    queue = [];
    dedupe = {};
  }

  // ── MutationObserver ───────────────────────────────────────────────
  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(function (mutations) {
      if (lang === DEFAULT_LANG) return;

      for (var m = 0; m < mutations.length; m++) {
        var mut = mutations[m];

        // New nodes added
        if (mut.type === "childList") {
          for (var j = 0; j < mut.addedNodes.length; j++) {
            var node = mut.addedNodes[j];
            if (node.nodeType === 1) {
              enqueue(node);
              // Scan descendants
              var children = node.getElementsByTagName ? node.getElementsByTagName("*") : [];
              for (var k = 0; k < children.length; k++) {
                enqueue(children[k]);
              }
            }
          }
        }

        // Text content changed (typewriter, animation)
        if (mut.type === "characterData") {
          var parent = mut.target.parentElement;
          if (parent && !parent.hasAttribute(ATTR.locked)) {
            var newTxt = mut.target.textContent.trim();
            var origTxt = parent.getAttribute(ATTR.orgText) || "";
            // Only re-translate if text actually changed meaningfully
            if (newTxt && newTxt !== origTxt && !isKey(newTxt) && newTxt.length > 2) {
              parent.removeAttribute(ATTR.status);
              dedupe = {}; // reset dedupe for animation re-processing
              enqueue(parent);
            }
          }
        }

        // Attribute changed
        if (
          mut.type === "attributes" &&
          (mut.attributeName === "placeholder" ||
            mut.attributeName === "aria-label" ||
            mut.attributeName === "title")
        ) {
          enqueue(mut.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────
  window.CyberAILocalizer = {
    /**
     * @param {Object} opts
     * @param {string} opts.targetLang - "EN" | "UZ" | "RU" | "TR" | ...
     * @param {Function} [opts.onLangChange] - callback(langCode)
     */
    init: function (opts) {
      opts = opts || {};
      lang = opts.targetLang || DEFAULT_LANG;
      onLangChange = opts.onLangChange || null;
      loadCache();

      if (lang !== DEFAULT_LANG) {
        var self = this;
        function boot() {
          scanPage();
          startObserver();
        }
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", boot);
        } else {
          boot();
        }
      }
      console.log("[Localizer] init →", lang);
    },

    /**
     * Switch language. Translates everything visible.
     */
    setLanguage: async function (newLang) {
      if (newLang === lang) return;

      // Abort in-flight requests
      if (abortCtrl) abortCtrl.abort();

      lang = newLang;

      if (newLang === DEFAULT_LANG) {
        revertAll();
        stopObserver();
        console.log("[Localizer] → EN (instant revert)");
      } else {
        // Clear status markers so everything re-translates
        var marked = document.querySelectorAll("[" + ATTR.status + "]");
        for (var i = 0; i < marked.length; i++) {
          marked[i].removeAttribute(ATTR.status);
        }
        dedupe = {};
        scanPage();
        startObserver();
        console.log("[Localizer] →", newLang);
      }

      if (onLangChange) onLangChange(newLang);
    },

    /** Instant revert to EN. */
    reset: function () {
      this.setLanguage(DEFAULT_LANG);
    },

    /** Force re-scan (call after injecting large DOM chunks). */
    rescan: function () {
      if (lang !== DEFAULT_LANG) {
        var marked = document.querySelectorAll("[" + ATTR.status + "]");
        for (var i = 0; i < marked.length; i++) marked[i].removeAttribute(ATTR.status);
        dedupe = {};
        scanPage();
      }
    },

    /** Get current language code. */
    getLanguage: function () {
      return lang;
    },

    /** Cache + queue stats. */
    getStats: function () {
      return {
        cachedKeys: Object.keys(cache).length,
        queueLength: queue.length,
        isTranslating: translating,
        currentLang: lang,
      };
    },

    /** Wipe translation cache. */
    clearCache: function () {
      cache = {};
      localStorage.removeItem(CACHE_KEY);
    },
  };
})();
