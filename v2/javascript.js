// 1. General DOMContentLoaded handler for carousel, modal, and contact form

document.addEventListener('DOMContentLoaded', function() {
    // Cases carousel controls
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

    function handleOpenCase(el) {
        const id = el.getAttribute('data-case-id');
        const detail = id ? document.getElementById(id) : null;
        if (detail) {
            openModal(detail.innerHTML);
        } else {
            const fallback = `<h3 id="modal-title">Case details</h3><p>Details are not available right now.</p>`;
            openModal(fallback);
        }
    }

    document.querySelectorAll('.case-card').forEach(card => {
        card.addEventListener('click', (e) => { e.preventDefault(); handleOpenCase(card); });
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenCase(card); } });
        card.querySelector('.btn-link')?.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); handleOpenCase(card); });
    });

    // Contact form -> Option C: copy message + open direct Telegram chat (app -> web) + optional share fallback
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
        msg.textContent = text || 'Message copied. Switch to Telegram to paste.';
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
        // Auto hide after 14s
        clearTimeout(host._hideTimer);
        host._hideTimer = setTimeout(() => { try { host.remove(); } catch(_){} }, 14000);
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = form.querySelector('input[name="name"]')?.value?.trim() || '';
            const phone = form.querySelector('input[name="phone"]')?.value?.trim() || '';
            const message = form.querySelector('textarea[name="message"]')?.value?.trim() || '';
            if (!name || !message) { alert('Please fill in your name and message.'); return; }

            const lines = [
                'Consultation request with Volha Vornei Grings, CEO',
                `Name: ${name}`,
                phone ? `Phone: ${phone}` : '',
                '',
                message
            ].filter(Boolean);
            const fullText = lines.join('\n');

            // Direct user username (must exist). Replace if actual username differs.
            const TELEGRAM_USERNAME = 'volhagrings';
            const tgAppUrl = `tg://resolve?domain=${TELEGRAM_USERNAME}`; // cannot carry text
            const tgWebUrl = `https://t.me/${TELEGRAM_USERNAME}`;
            // Share fallback (lets them pick destination WITH text)
            const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(fullText)}`;

            // Copy to clipboard so user can paste once chat opens
            let copied = false;
            if (navigator.clipboard && window.isSecureContext) {
                try { await navigator.clipboard.writeText(fullText); copied = true; } catch(_){}
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
                text: copied ? 'Message copied. Opening Telegram chat… Paste it there.' : 'Opening Telegram. You may need to paste manually.',
                actions: [
                    { label: 'Open Chat Again', onClick: () => { window.location.href = tgAppUrl; } },
                    { label: 'Browser Chat', onClick: () => { window.location.href = tgWebUrl; } },
                    { label: 'Share Instead', onClick: () => { window.open(shareUrl, '_blank','noopener'); } }
                ]
            });

            let navigated = false;
            const primaryTimer = setTimeout(() => {
                if (!navigated && document.visibilityState === 'visible') {
                    // Fallback to web chat
                    window.location.href = tgWebUrl;
                    // After another delay, if still here, encourage share
                    setTimeout(() => {
                        if (document.visibilityState === 'visible') {
                            showTelegramToast({
                                text: 'If Telegram chat did not open, use Share to select a destination or copy manually.',
                                actions: [
                                    { label: 'Open Share', onClick: () => { window.open(shareUrl,'_blank','noopener'); } },
                                    { label: 'Retry App', onClick: () => { window.location.href = tgAppUrl; } }
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

            // Kick off direct app attempt
            window.location.href = tgAppUrl;
        });
    }

    // Policy documents modal delegation (moved from inline footer script)
    document.addEventListener('click', function(e){
        const link = e.target.closest('a[data-policy]');
        if(!link) return;
        // Restrict to primary (left / center) footer list or modal content navigation
        e.preventDefault();
        const url = link.getAttribute('data-policy');
        if(!url) return;
        const modal = document.getElementById('case-modal');
        const modalContent = modal?.querySelector('.modal-content');
        if(!modal || !modalContent) return;
        link.classList.add('policy-loading');
        // Open immediately with loading placeholder for perceived responsiveness
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

// 2. Scoped About chips enrichment IIFE
(function(){
    const host = document.getElementById('about');
    const chipsEl = host?.querySelector('#about-chips');
    const toggleBtn = host?.querySelector('#about-chips-toggle');
    if (!host || !chipsEl || !toggleBtn) return;
    const base = [ 'Slots casino','Game dev','Crypto','SaaS','Fintech','Web3', 'Backend','Frontend','Mobile','DevOps','Data','Security','Product','QA', 'ML/AI','Cloud','SRE','Design' ];
    function renderChips(tags){ chipsEl.innerHTML=''; tags.forEach(t=>{ const span=document.createElement('span'); span.className='chip'; span.textContent=t; chipsEl.appendChild(span); }); }
    function uniqueSorted(arr){ return Array.from(new Set(arr)).sort((a,b)=> a.localeCompare(b)); }
    function applyToggle(){ const expanded = toggleBtn.getAttribute('aria-expanded') === 'true'; if (expanded) { chipsEl.classList.remove('collapsed'); toggleBtn.textContent='Show less'; toggleBtn.setAttribute('aria-expanded','true'); } else { chipsEl.classList.add('collapsed'); toggleBtn.textContent='Show more'; toggleBtn.setAttribute('aria-expanded','false'); } }
    toggleBtn.addEventListener('click', () => { const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true'; toggleBtn.setAttribute('aria-expanded', String(!isExpanded)); applyToggle(); });
    renderChips(uniqueSorted(base));
    applyToggle();
    (async function(){
        try {
            const res = await fetch('cases/index.json', { credentials: 'same-origin' });
            if (!res.ok) throw new Error('HTTP '+res.status);
            const items = await res.json();
            const extra = [];
            (items || []).forEach(it => { (it.tags || []).forEach(tag => extra.push(tag)); });
            if (extra.length) { const merged = uniqueSorted(base.concat(extra)); renderChips(merged); applyToggle(); }
        } catch(_) { /* silent */ }
    })();
})();

// 3. Cases module script IIFE (advanced modal navigation & dynamic case rendering)
(function(){
    const section = document.getElementById('cases');
    const track = section?.querySelector('.cases-track');
    const manifestUrl = 'cases/index.json';
    let items = [];
    let currentIndex = -1;

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
        try { const resp = await fetch(url, { credentials: 'same-origin' }); if (!resp.ok) throw new Error('HTTP '+resp.status); return await resp.text(); }
        catch (err) { return '<h3>Case details</h3><p>Sorry, we\'re unable to load this case right now.</p>'; }
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

    async function render(){
        if (!track) return;
        try {
            const res = await fetch(manifestUrl, { credentials: 'same-origin' });
            if (!res.ok) throw new Error('HTTP '+res.status);
            items = await res.json();
            track.innerHTML = '';
            items.forEach((item, i) => {
                const el = document.createElement('article');
                el.className = 'case-card';
                el.setAttribute('data-case-id', item.id);
                el.setAttribute('tabindex', '0');
                el.setAttribute('aria-label', 'Open case: ' + (item.title || 'Case'));
                const tagsHtml = (item.tags || []).map(t => `<span class="chip">${t}</span>`).join('');
                el.innerHTML = `\n                        <h3 class="case-title">${item.title || 'Case'}</h3>\n                        <p class="case-sub">${item.summary || ''}</p>\n                        <div class="case-tags">${tagsHtml}</div>\n                        <div class="case-cta"><button class="btn-link" type="button">Read more <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>\n                    `;
                track.appendChild(el);
                attachCardHandlers(el, item, i);
            });
        } catch (err) {
            track.innerHTML = '<div style="padding:12px;color:#D8D8F0;">Could not load cases at the moment.</div>';
        }
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); } else { render(); }
})();
