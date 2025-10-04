// 1. General DOMContentLoaded handler for carousel, modal, and contact form

document.addEventListener('DOMContentLoaded', function() {
    // Cases carousel controls (static scroll only; actual cases rendering moved below after i18n ready)
    const track = document.querySelector('.cases-track');
    const prevBtn = document.querySelector('.cases-nav.prev');
    const nextBtn = document.querySelector('.cases-nav.next');
    function scrollByAmount(dir = 1) {
        if (!track) return;
        const amount = Math.max(300, Math.floor(track.clientWidth * 0.9));
        track.scrollBy({ left: amount * dir, behavior: 'smooth' });
    }
    prevBtn?.addEventListener('click', () => scrollByAmount(-1));
    nextBtn?.addEventListener('click', () => scrollByAmount(1));

    // Modal logic (basic case-card version)
    const modal = document.getElementById('case-modal');
    const modalContent = modal?.querySelector('.modal-content');
    const closeBtn = modal?.querySelector('.modal-close');
    function openModal(html) {
        if (!modal || !modalContent) return;
        modalContent.innerHTML = html;
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
        setTimeout(() => { closeBtn?.focus(); }, 0);
    }
    function closeModal() {
        if (!modal) return;
        modal.classList.remove('open');
        document.body.classList.remove('no-scroll');
    }
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    function openCaseFallback() {
        const t = (ns, key) => (window.I18N ? I18N.t(ns, key) : key);
        const title = t('cases','modal_title');
        const body = t('cases','fallback_modal_body');
        return `<h3 id="modal-title">${title}</h3><p>${body}</p>`;
    }

    function handleOpenCase(el) {
        const id = el.getAttribute('data-case-id');
        const detail = id ? document.getElementById(id) : null;
        if (detail) {
            openModal(detail.innerHTML);
        } else {
            openModal(openCaseFallback());
        }
    }

    document.querySelectorAll('.case-card').forEach(card => {
        card.addEventListener('click', (e) => { e.preventDefault(); handleOpenCase(card); });
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenCase(card); } });
        card.querySelector('.btn-link')?.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); handleOpenCase(card); });
    });

    // Contact form -> i18n enabled messages
    const form = document.querySelector('.formal-contact-form');

    function showTelegramToast(opts) {
        const { text, actions = [] } = opts || {};
        let host = document.getElementById('tg-toast');
        if (!host) {
            host = document.createElement('div');
            host.id = 'tg-toast';
            host.setAttribute('role','status');
            host.style.cssText = 'position:fixed;z-index:9999;left:50%;bottom:18px;transform:translateX(-50%);max-width:440px;width:calc(100% - 32px);background:#1f2330;color:#fff;padding:14px 16px;border-radius:10px;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(host);
        }
        host.innerHTML = '';
        const msg = document.createElement('div');
        msg.textContent = text || (window.I18N ? I18N.t('contact','copied_opening') : 'Message copied. Switch to Telegram to paste.');
        host.appendChild(msg);
        if (actions.length) {
            const row = document.createElement('div');
            row.style.display='flex';
            row.style.flexWrap='wrap';
            row.style.gap='8px';
            actions.forEach(a => {
                const btn = document.createElement('button');
                btn.type='button';
                btn.textContent = a.label;
                btn.style.cssText='background:#3d7eff;color:#fff;border:0;border-radius:6px;padding:6px 10px;cursor:pointer;font:600 13px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;flex:0 0 auto;';
                btn.addEventListener('click', a.onClick);
                row.appendChild(btn);
            });
            host.appendChild(row);
        }
        clearTimeout(host._hideTimer);
        host._hideTimer = setTimeout(() => { try { host.remove(); } catch(_){} }, 14000);
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const t = (ns, key) => (window.I18N ? I18N.t(ns, key) : key);
            const name = form.querySelector('input[name="name"]')?.value?.trim() || '';
            const phone = form.querySelector('input[name="phone"]')?.value?.trim() || '';
            const message = form.querySelector('textarea[name="message"]')?.value?.trim() || '';
            if (!name || !message) { alert(t('contact','form_incomplete')); return; }

            const headingLine = t('contact','heading');
            const lines = [
                headingLine,
                `Name: ${name}`,
                phone ? `Phone: ${phone}` : '',
                '',
                message
            ].filter(Boolean);
            const fullText = lines.join('\n');

            const TELEGRAM_USERNAME = 'volhagrings';
            const tgAppUrl = `tg://resolve?domain=${TELEGRAM_USERNAME}`;
            const tgWebUrl = `https://t.me/${TELEGRAM_USERNAME}`;
            const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(fullText)}`;

            let copied = false;
            if (navigator.clipboard && window.isSecureContext) {
                try { await navigator.clipboard.writeText(fullText); copied = true; } catch(_){ }
            }
            if (!copied) {
                try {
                    const ta = document.createElement('textarea');
                    ta.style.position='fixed'; ta.style.opacity='0';
                    ta.value = fullText; document.body.appendChild(ta); ta.select();
                    document.execCommand('copy'); document.body.removeChild(ta); copied = true;
                } catch(_){}
            }

            showTelegramToast({
                text: copied ? t('contact','copied_opening') : t('contact','opening_no_copy'),
                actions: [
                    { label: t('contact','open_chat_again_btn'), onClick: () => { window.location.href = tgAppUrl; } },
                    { label: t('contact','browser_chat_btn'), onClick: () => { window.location.href = tgWebUrl; } },
                    { label: t('contact','share_instead_btn'), onClick: () => { window.open(shareUrl, '_blank','noopener'); } }
                ]
            });

            let navigated = false;
            const primaryTimer = setTimeout(() => {
                if (!navigated && document.visibilityState === 'visible') {
                    window.location.href = tgWebUrl;
                    setTimeout(() => {
                        if (document.visibilityState === 'visible') {
                            showTelegramToast({
                                text: t('contact','toast_retry'),
                                actions: [
                                    { label: t('contact','open_share_btn'), onClick: () => { window.open(shareUrl,'_blank','noopener'); } },
                                    { label: t('contact','retry_app_btn'), onClick: () => { window.location.href = tgAppUrl; } }
                                ]
                            });
                        }
                    }, 1300);
                }
            }, 800);

            const onVis = () => {
                if (document.visibilityState === 'hidden') {
                    navigated = true;
                    clearTimeout(primaryTimer);
                    document.removeEventListener('visibilitychange', onVis);
                }
            };
            document.addEventListener('visibilitychange', onVis);
            window.location.href = tgAppUrl;
        });
    }

    // Policy documents modal delegation (unchanged except for leaving hard-coded text for now)
    document.addEventListener('click', function(e){
        const link = e.target.closest('a[data-policy]');
        if(!link) return;
        e.preventDefault();
        const url = link.getAttribute('data-policy');
        if(!url) return;
        const modal = document.getElementById('case-modal');
        const modalContent = modal?.querySelector('.modal-content');
        if(!modal || !modalContent) return;
        link.classList.add('policy-loading');
        modalContent.innerHTML = '<p style="margin:0;font-size:0.9em;opacity:.85;">Loading…</p>';
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
        setTimeout(()=>{ modal.querySelector('.modal-close')?.focus(); },0);
        (async ()=>{
            try {
                const res = await fetch(url, { credentials: 'same-origin' });
                if(!res.ok) throw new Error('HTTP '+res.status);
                const html = await res.text();
                modalContent.innerHTML = html || '<p>Empty document.</p>';
            } catch(err) {
                modalContent.innerHTML = '<h3>Document</h3><p>Unable to load content.</p>';
            } finally {
                link.classList.remove('policy-loading');
            }
        })();
    });

    // Dynamic footer year injection
    (function updateFooterYear(){
        const year = String(new Date().getFullYear());
        document.querySelectorAll('[data-current-year]').forEach(el => {
            if (el.textContent !== year) el.textContent = year;
            el.setAttribute('aria-label', `Current year ${year}`);
        });
    })();
});

// Helper to get current language safely
function __currentLang(){ return (window.I18N && I18N.lang) ? I18N.lang : 'en'; }

// 2. Scoped About chips enrichment IIFE (now i18n aware)
(function(){
    const host = document.getElementById('about');
    const chipsEl = host?.querySelector('#about-chips');
    const toggleBtn = host?.querySelector('#about-chips-toggle');
    if (!host || !chipsEl || !toggleBtn) return;
    const base = [ 'Slots casino','Game dev','Crypto','SaaS','Fintech','Web3', 'Backend','Frontend','Mobile','DevOps','Data','Security','Product','QA', 'ML/AI','Cloud','SRE','Design' ];
    function renderChips(tags){ chipsEl.innerHTML=''; tags.forEach(t=>{ const span=document.createElement('span'); span.className='chip'; span.textContent=t; chipsEl.appendChild(span); }); }
    function uniqueSorted(arr){ return Array.from(new Set(arr)).sort((a,b)=> a.localeCompare(b)); }
    function label(expanded){ const t=(ns,k)=> (window.I18N?I18N.t(ns,k):k); return expanded ? t('about','chips_show_less') : t('about','chips_show_more'); }
    function applyToggle(){ const expanded = toggleBtn.getAttribute('aria-expanded') === 'true'; if (expanded) { chipsEl.classList.remove('collapsed'); } else { chipsEl.classList.add('collapsed'); } toggleBtn.textContent = label(expanded); }
    toggleBtn.addEventListener('click', () => { const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true'; toggleBtn.setAttribute('aria-expanded', String(!isExpanded)); applyToggle(); });
    renderChips(uniqueSorted(base));
    applyToggle();
    async function enrichWithTags(){
        // Use language-specific manifest if present
        const lang = __currentLang();
        const localized = `cases/${lang}/index.json`;
        let list = null;
        try { const r = await fetch(localized, { credentials:'same-origin', cache:'no-cache' }); if (r.ok) list = await r.json(); } catch(_){ }
        if (!list) {
            try { const r2 = await fetch('cases/index.json', { credentials:'same-origin', cache:'no-cache' }); if (r2.ok) list = await r2.json(); } catch(_){ }
        }
        if (Array.isArray(list)) {
            const extra = []; list.forEach(it => (it.tags||[]).forEach(t=> extra.push(t)) );
            if (extra.length) { const merged = uniqueSorted(base.concat(extra)); renderChips(merged); applyToggle(); }
        }
    }
    enrichWithTags();
    // Re-label and re-enrich on language change
    window.addEventListener('i18n:ready', () => { applyToggle(); enrichWithTags(); });
    if (window.I18N) I18N.onChange(()=> { applyToggle(); enrichWithTags(); });
})();

// 3. Cases module script IIFE (i18n aware - improved)
(function(){
    const section = document.getElementById('cases');
    const track = section?.querySelector('.cases-track');
    if (!section || !track) return;
    const baseManifestFallback = 'cases/index.json';
    let items = [];
    let currentIndex = -1; // index of currently open modal case (if any)
    let lastRenderedLang = null;
    let renderToken = 0; // concurrency guard

    function currentLang(){ return __currentLang(); }
    function manifestUrlFor(lang){ return `cases/${lang}/index.json`; }

    async function fetchManifest(){
        const lang = currentLang();
        const localized = manifestUrlFor(lang);
        const attempts = [localized, './'+localized, baseManifestFallback];
        for (const url of attempts){
            try {
                const res = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' });
                if (!res.ok) throw new Error('HTTP '+res.status);
                const json = await res.json();
                if (Array.isArray(json)) { if (url !== localized) console.warn('[cases] Using fallback manifest:', url); return json; }
            } catch(err){
                console.warn('[cases] Manifest fetch failed for', url, err.message);
            }
        }
        console.error('[cases] All manifest fetch attempts failed');
        return [];
    }

    function applyCasesTheme(modal){
        if (!modal) return;
        modal.classList.add('theme-cases');
        const closeBtn = modal.querySelector('.modal-close');
        const cleanup = () => {
            modal.classList.remove('theme-cases');
            if (modal._casesTeardown) { try { modal._casesTeardown(); } catch(_){} }
            modal._casesTeardown = null;
        };
        closeBtn?.addEventListener('click', cleanup, { once: true });
        modal.addEventListener('click', function onBackdrop(e){ if (e.target === modal) { cleanup(); modal.removeEventListener('click', onBackdrop); } });
        function onEsc(e){ if (e.key === 'Escape') { cleanup(); document.removeEventListener('keydown', onEsc); } }
        document.addEventListener('keydown', onEsc);
    }

    function ensureModalNav(modal){
        const host = modal;
        let prev = host.querySelector('.modal-step-nav.prev');
        let next = host.querySelector('.modal-step-nav.next');
        if (!prev) { prev = document.createElement('button'); prev.type='button'; prev.className='modal-step-nav prev'; prev.setAttribute('aria-label','Previous case'); prev.innerHTML='<i class="fa-solid fa-chevron-left" aria-hidden="true"></i>'; host.appendChild(prev); }
        if (!next) { next = document.createElement('button'); next.type='button'; next.className='modal-step-nav next'; next.setAttribute('aria-label','Next case'); next.innerHTML='<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>'; host.appendChild(next); }
        if (!modal._casesNavBound) {
            const step = (d) => stepCase(d);
            const onPrev = (e) => { e.preventDefault(); step(-1); };
            const onNext = (e) => { e.preventDefault(); step(1); };
            prev.addEventListener('click', onPrev);
            next.addEventListener('click', onNext);
            const onKey = (e) => { if (!modal.classList.contains('open')) return; if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } };
            document.addEventListener('keydown', onKey);
            modal._casesTeardown = () => { try { prev.removeEventListener('click', onPrev); } catch(_){} try { next.removeEventListener('click', onNext); } catch(_){} try { document.removeEventListener('keydown', onKey); } catch(_){} try { prev.remove(); } catch(_){} try { next.remove(); } catch(_){} modal._casesNavBound = false; };
            modal._casesNavBound = true;
        }
    }

    function normalizeIndex(i, len){ return (i % len + len) % len; }

    async function openCaseAt(i){ if (!items || !items.length) return; currentIndex = normalizeIndex(i, items.length); const item = items[currentIndex]; const html = await fetchText(item.contentPath); openModal(html); }
    function stepCase(d){ if (!items || !items.length) return; openCaseAt(currentIndex + d); }

    function openModal(html){
        const modal = document.getElementById('case-modal');
        if (!modal) return;
        const modalContent = modal.querySelector('.modal-content');
        const closeBtn = modal.querySelector('.modal-close');
        if (!modalContent) return;
        modalContent.innerHTML = html;
        modal.classList.add('open');
        document.body.classList.add('no-scroll');
        setTimeout(() => { closeBtn?.focus(); }, 0);
        applyCasesTheme(modal);
        if (items && items.length > 1) ensureModalNav(modal);
    }

    async function fetchText(url){
        const t = (ns, key) => (window.I18N ? I18N.t(ns,key) : key);
        try { const resp = await fetch(url, { credentials: 'same-origin', cache: 'no-cache' }); if (!resp.ok) throw new Error('HTTP '+resp.status); return await resp.text(); }
        catch (err) { return `<h3>${t('cases','modal_title')}</h3><p>${t('cases','fallback_modal_body')}</p>`; }
    }

    function attachCardHandlers(cardEl, item, index){
        const open = async (e) => { if (e) e.preventDefault(); await openCaseAt(index); };
        cardEl.addEventListener('click', open);
        cardEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        cardEl.querySelector('.btn-link')?.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); open(e); });
        const prefetch = async () => { if (cardEl._prefetchHtml) return; const html = await fetchText(item.contentPath); cardEl._prefetchHtml = html; };
        cardEl.addEventListener('mouseenter', prefetch, { passive: true });
        cardEl.addEventListener('touchstart', prefetch, { passive: true });
    }

    function scheduleIdle(fn){ if ('requestIdleCallback' in window) { requestIdleCallback(fn, { timeout: 2500 }); } else { setTimeout(fn, 1200); } }

    function prefetchAlternateLanguage(){
        const lang = currentLang();
        const alt = lang === 'en' ? 'ru' : 'en';
        const altManifest = manifestUrlFor(alt);
        fetch(altManifest, { credentials: 'same-origin' })
            .then(r => r.ok ? r.json() : null)
            .then(list => {
                if (!list) return;
                list.forEach(it => { fetch(it.contentPath, { credentials: 'same-origin' }).catch(()=>{}); });
            })
            .catch(()=>{});
    }

    async function render(){
        const myToken = ++renderToken;
        const lang = currentLang();
        const t = (ns, key, vars) => (window.I18N ? I18N.t(ns,key,vars) : key);
        if (!track) return;
        try {
            const manifest = await fetchManifest();
            if (myToken !== renderToken) return; // stale
            items = manifest;
            track.setAttribute('data-cases-lang', lang);
            track.innerHTML = '';
            if (!items.length) { track.innerHTML = `<div style="padding:12px;color:#D8D8F0;">${t('cases','load_error')}</div>`; return; }
            items.forEach((item, i) => {
                const title = item.title || t('cases','generic_case');
                const summary = item.summary || '';
                const el = document.createElement('article');
                el.className = 'case-card';
                el.setAttribute('data-case-id', item.id);
                el.setAttribute('tabindex', '0');
                el.setAttribute('aria-label', t('cases','open_case_aria',{ title }));
                const tagsHtml = (item.tags || []).map(tag => `<span class=\"chip\">${tag}</span>`).join('');
                el.innerHTML = `\n                        <h3 class=\"case-title\">${title}</h3>\n                        <p class=\"case-sub\">${summary}</p>\n                        <div class=\"case-tags\">${tagsHtml}</div>\n                        <div class=\"case-cta\"><button class=\"btn-link\" type=\"button\">${t('cases','read_more')} <i class=\"fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>\n                    `;
                track.appendChild(el);
                attachCardHandlers(el, item, i);
            });
            if (track.firstElementChild) track.firstElementChild.focus({ preventScroll:true });
            const modal = document.getElementById('case-modal');
            if (modal?.classList.contains('open') && lastRenderedLang && lastRenderedLang !== lang && currentIndex >=0) {
                const openArticle = items[currentIndex];
                if (openArticle) { fetchText(openArticle.contentPath).then(html => openModal(html)); }
            }
            lastRenderedLang = lang;
            scheduleIdle(prefetchAlternateLanguage);
        } catch(err){
            if (myToken !== renderToken) return; // stale
            track.innerHTML = `<div style=\"padding:12px;color:#D8D8F0;\">${t('cases','load_error')}</div>`;
            console.error('[cases] render error', err);
        }
    }

    function setup(){ render(); if (window.I18N) I18N.onChange(()=> { render(); }); }

    if (document.readyState === 'loading') { window.addEventListener('i18n:ready', setup, { once: true }); }
    else { if (window.I18N && window.I18N.scanned) { setup(); } else { window.addEventListener('i18n:ready', setup, { once: true }); } }
})();
