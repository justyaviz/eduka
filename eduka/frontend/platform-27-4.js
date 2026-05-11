(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const api = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  };
  const toast = (msg) => {
    let box = $('.ed27-toast');
    if (!box) { box = document.createElement('div'); box.className = 'ed27-toast'; document.body.appendChild(box); }
    box.textContent = msg; box.classList.add('show'); clearTimeout(box._t); box._t=setTimeout(()=>box.classList.remove('show'),2800);
  };
  const money = (n) => Number(n || 0).toLocaleString('uz-UZ') + " so'm";
  const statusBadge = (status) => `<span class="ed27-badge ${status === 'ready' || status === 'active' || status === 'completed' ? 'ok' : status === 'blocked' || status === 'failed' ? 'bad' : 'warn'}">${status || 'draft'}</span>`;

  async function renderWorkflowPanel(root) {
    const data = await api('/api/workflow27/checklist');
    root.innerHTML = `<section class="ed27-panel"><div class="ed27-head"><div><h2>27.1 Real Workflow Test</h2><p>CEO → Admin → Student App → Telegram → Finance jarayonlarini bosqichma-bosqich tekshiradi.</p></div><div class="ed27-actions"><button class="ed27-btn" data-run-workflow>Test run saqlash</button><button class="ed27-btn secondary" data-refresh27>Yangilash</button></div></div><div class="ed27-checklist">${data.checklist.map(i=>`<div class="ed27-check"><span class="ed27-dot ${i.status === 'ready' ? '' : 'warn'}"></span><div><b>${i.title}</b><br><small>${i.path}</small><br>${statusBadge(i.status)}</div></div>`).join('')}</div></section>`;
    $('[data-run-workflow]', root)?.addEventListener('click', async () => {
      await api('/api/workflow27/run', { method:'POST', body: JSON.stringify({ checklist: data.checklist }) }); toast('Workflow test saqlandi');
    });
    $('[data-refresh27]', root)?.addEventListener('click', () => renderWorkflowPanel(root));
  }

  async function renderAdminCrmPanel(root) {
    const data = await api('/api/app/admin-crm27/overview');
    const d = data.data || {};
    root.innerHTML = `<section class="ed27-panel"><div class="ed27-head"><div><h2>27.2 Admin CRM Real Polish</h2><p>Talaba, guruh, o‘qituvchi, to‘lov, davomat, chek va export jarayonlari.</p></div><div class="ed27-actions"><button class="ed27-btn" data-recalc>Qarzdorlikni qayta hisoblash</button></div></div><div class="ed27-grid"><div class="ed27-card"><span>Talabalar</span><strong>${d.students||0}</strong></div><div class="ed27-card"><span>O‘qituvchilar</span><strong>${d.teachers||0}</strong></div><div class="ed27-card"><span>Guruhlar</span><strong>${d.groups||0}</strong></div><div class="ed27-card"><span>Jami tushum</span><strong>${money(d.revenue)}</strong></div><div class="ed27-card"><span>Qarzdorlik</span><strong>${money(d.debt)}</strong></div></div></section>`;
    $('[data-recalc]', root)?.addEventListener('click', async()=>{ await api('/api/app/admin-crm27/debts/recalculate',{method:'POST',body:'{}'}); toast('Qarzdorlik qayta hisoblandi'); renderAdminCrmPanel(root); });
  }

  async function renderFinancePanel(root) {
    const data = await api('/api/app/finance27/overview');
    const d = data.data || {};
    root.innerHTML = `<section class="ed27-panel"><div class="ed27-head"><div><h2>27.3 Finance Real Accounting</h2><p>Kassa, to‘lov bekor qilish, xarajat, oylik va bonuslar uchun production poydevor.</p></div><div class="ed27-actions"><button class="ed27-btn" data-open-cashbox>Kassa ochish</button><button class="ed27-btn secondary" data-close-cashbox>Kassa yopish</button></div></div><div class="ed27-grid"><div class="ed27-card"><span>Bugungi kirim</span><strong>${money(d.today_in)}</strong></div><div class="ed27-card"><span>Bugungi chiqim</span><strong>${money(d.today_out)}</strong></div><div class="ed27-card"><span>Balans</span><strong>${money(d.balance)}</strong></div><div class="ed27-card"><span>Oylik tushum</span><strong>${money(d.month_revenue)}</strong></div><div class="ed27-card"><span>Oylik xarajat</span><strong>${money(d.month_expenses)}</strong></div></div><h3>Oxirgi kassa amallari</h3><table class="ed27-table"><thead><tr><th>Turi</th><th>Kategoriya</th><th>Usul</th><th>Summa</th><th>Sana</th></tr></thead><tbody>${(d.transactions||[]).map(t=>`<tr><td>${statusBadge(t.type)}</td><td>${t.category||''}</td><td>${t.method||''}</td><td>${money(t.amount)}</td><td>${new Date(t.created_at).toLocaleString('uz-UZ')}</td></tr>`).join('') || '<tr><td colspan="5">Hali amallar yo‘q</td></tr>'}</tbody></table></section>`;
    $('[data-open-cashbox]', root)?.addEventListener('click', async()=>{ await api('/api/app/finance27/cashbox/open',{method:'POST',body:JSON.stringify({opening_balance:0,note:'Auto open'})}); toast('Kassa ochildi'); renderFinancePanel(root); });
    $('[data-close-cashbox]', root)?.addEventListener('click', async()=>{ await api('/api/app/finance27/cashbox/close',{method:'POST',body:'{}'}); toast('Kassa yopildi'); renderFinancePanel(root); });
  }

  async function renderCeoMonetizationPanel(root) {
    const data = await api('/api/super/monetization27/overview');
    const d = data.data || {};
    root.innerHTML = `<section class="ed27-panel"><div class="ed27-head"><div><h2>27.4 CEO SaaS Monetization Final</h2><p>Tarif, feature flags, limitlar, bloklash, obuna va invoice boshqaruvi.</p></div></div><div class="ed27-grid">${(d.plans||[]).map(p=>`<div class="ed27-card"><span>${p.code}</span><strong>${p.name}</strong><p>${money(p.monthly_price)} / oy</p>${statusBadge(p.status)}</div>`).join('')}</div><h3>Markazlar</h3><table class="ed27-table"><thead><tr><th>Markaz</th><th>Tarif</th><th>Obuna</th><th>Blok</th></tr></thead><tbody>${(d.centers||[]).map(c=>`<tr><td>${c.name}</td><td>${c.plan_code||'start'}</td><td>${statusBadge(c.subscription_status)}</td><td>${c.blocked_at ? statusBadge('blocked') : statusBadge('active')}</td></tr>`).join('') || '<tr><td colspan="4">Markazlar yo‘q</td></tr>'}</tbody></table></section>`;
  }

  async function boot() {
    const path = location.pathname;
    const mount = document.querySelector('[data-ed27-mount]');
    if (mount) {
      if (path.includes('finance27')) return renderFinancePanel(mount);
      if (path.includes('ceo27')) return renderCeoMonetizationPanel(mount);
      if (path.includes('admin27')) return renderAdminCrmPanel(mount);
      return renderWorkflowPanel(mount);
    }
    // lightweight augmentation: add quick panel to existing production pages
    const content = document.querySelector('.content, main, [data-view-root]');
    if (!content || document.querySelector('.ed27-panel')) return;
    if (path.includes('/admin/production') || path.includes('/ceo/production')) {
      const panel = document.createElement('div'); panel.setAttribute('data-ed27-mount',''); content.prepend(panel); renderWorkflowPanel(panel).catch(()=>{});
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
