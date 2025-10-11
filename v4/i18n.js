// Lightweight i18n system (Option B) for this site.
// Provides window.I18N with methods: scan(), setLang(lang), t(ns,key,vars), apply(root), register(root)
(function(){
  const ATTR_MAP = [
    { attr: 'data-i18n', target: 'textContent' },
    { attr: 'data-i18n-html', target: 'innerHTML' },
    { attr: 'data-i18n-placeholder', target: 'placeholder' },
    { attr: 'data-i18n-aria-label', target: 'aria-label' },
    { attr: 'data-i18n-title', target: 'title' },
    { attr: 'data-i18n-value', target: 'value' }
  ];
  const I18N = {
    lang: 'en',
    fallback: 'en',
    store: {},         // { lang: { ns: { key: value } } }
    index: [],         // [{ el, ns, key, prop }]
    scanned: false,
    pendingLoads: {},
    listeners: new Set(),
    onChange(fn){ this.listeners.add(fn); return () => this.listeners.delete(fn); },
    _emit(){ this.listeners.forEach(fn => { try { fn(this.lang); } catch(_){} }); },
    split(nsKey){
      if (!nsKey) return { ns:'common', key: nsKey };
      if (nsKey.includes(':')) { const [ns, key] = nsKey.split(':'); return { ns, key }; }
      return { ns: 'common', key: nsKey };
    },
    interpolate(str, vars){
      if (!vars) return str;
      return str.replace(/{{(\w+)}}/g, (m,k) => (vars[k] != null ? vars[k] : m));
    },
    t(ns, key, vars){
      let v = this.store[this.lang]?.[ns]?.[key];
      if (v == null) v = this.store[this.fallback]?.[ns]?.[key];
      if (v == null) return key; // show key when missing
      return this.interpolate(v, vars);
    },
    ensureLang(lang){ if (!this.store[lang]) this.store[lang] = {}; },
    async loadNamespace(lang, ns){
      this.ensureLang(lang);
      if (this.store[lang][ns]) return; // already loaded
      const token = lang+':'+ns;
      if (this.pendingLoads[token]) return this.pendingLoads[token];
      const url = `i18n/${lang}/${ns}.json`;
      this.pendingLoads[token] = fetch(url, { credentials: 'same-origin' })
        .then(r => { if (!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(json => { this.store[lang][ns] = json; })
        .catch(err => { console.warn('[i18n] Failed to load', url, err); this.store[lang][ns] = {}; })
        .finally(()=> { delete this.pendingLoads[token]; });
      return this.pendingLoads[token];
    },
    async preload(lang, namespaces){ await Promise.all(namespaces.map(ns => this.loadNamespace(lang, ns))); },
    scan(root){
      const scope = root || document;
      const found = [];
      ATTR_MAP.forEach(desc => {
        scope.querySelectorAll('['+desc.attr+']').forEach(el => {
          const raw = el.getAttribute(desc.attr);
            const { ns, key } = this.split(raw);
            found.push({ el, ns, key, prop: desc.target });
        });
      });
      if (!root) this.index = found; else this.index = this.index.concat(found);
      this.scanned = true;
      return found;
    },
    async setLang(lang){
      if (!lang || lang === this.lang) { return this.apply(); }
      this.lang = lang;
      document.documentElement.setAttribute('lang', lang);
      localStorage.setItem('lang', lang);
      // Determine needed namespaces
      const namespaces = Array.from(new Set(this.index.map(i => i.ns)));
      await this.preload(lang, namespaces);
      this.apply();
      this._emit();
    },
    apply(root){
      const list = root ? this.scan(root) : this.index;
      list.forEach(rec => {
        const value = this.t(rec.ns, rec.key);
        if (rec.prop === 'textContent') rec.el.textContent = value; else if (rec.prop === 'innerHTML') rec.el.innerHTML = value; else rec.el.setAttribute(rec.prop, value);
      });
    },
    register(root){ this.scan(root); this.apply(root); },
    initFromSelector(){
      const sel = document.querySelector('.lang-selector');
      if (!sel) return;
      sel.value = this.lang;
      sel.addEventListener('change', (e) => { this.setLang(e.target.value); });
    },
    async init(){
      const stored = localStorage.getItem('lang');
      const navLang = navigator.language ? navigator.language.slice(0,2) : 'en';
      this.lang = stored || (['en','ru'].includes(navLang) ? navLang : 'en');
      this.scan();
      const namespaces = Array.from(new Set(this.index.map(i => i.ns)));
      await this.preload(this.fallback, namespaces); // ensure fallback loaded
      if (this.lang !== this.fallback) await this.preload(this.lang, namespaces);
      this.apply();
      this.initFromSelector();
      window.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: this.lang } }));
    }
  };
  window.I18N = I18N;
  document.addEventListener('DOMContentLoaded', () => { I18N.init(); });
})();

