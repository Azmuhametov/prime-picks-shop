(() => {
  /* ================= Данные товаров (заглушки) ================= */
  const PRODUCTS = [
    { id: 1, name: 'Куртка Urban Shell',  cat: 'Куртки и пальто', gender: 'men',   icon: 'i-jacket',  price: 8990,  oldPrice: 12990, badge: 'Топ' },
    { id: 2, name: 'Худи Night Drop',     cat: 'Худи и свитшоты', gender: 'men',   icon: 'i-hoodie',  price: 4590,  oldPrice: null,  badge: null },
    { id: 3, name: 'Футболка Core Heavy', cat: 'Футболки',        gender: 'men',   icon: 'i-tee',     price: 1990,  oldPrice: 2490,  badge: '-20%' },
    { id: 4, name: 'Брюки Carbon Wide',   cat: 'Штаны и джинсы',  gender: 'men',   icon: 'i-pants',   price: 5490,  oldPrice: null,  badge: 'Новинка' },
    { id: 5, name: 'Кепка Street Line',   cat: 'Мелочёвка',       gender: 'women', icon: 'i-cap',     price: 1490,  oldPrice: null,  badge: null },
    { id: 6, name: 'Кроссовки Velo Low',  cat: 'Кроссовки',       gender: 'women', icon: 'i-sneaker', price: 7290,  oldPrice: 8990,  badge: '-19%' },
    { id: 7, name: 'Худи Mist Oversize',  cat: 'Худи и свитшоты', gender: 'women', icon: 'i-hoodie',  price: 4990,  oldPrice: null,  badge: 'Новинка' },
    { id: 8, name: 'Куртка Aero Light',   cat: 'Куртки и пальто', gender: 'women', icon: 'i-jacket',  price: 9990,  oldPrice: null,  badge: null },
  ];

  /* ================= Состояние (сохраняется в localStorage) ================= */
  const KEYS = { cart: 'pp-cart', favs: 'pp-favs', theme: 'pp-theme' };
  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* хранилище недоступно */ }
  };

  const state = {
    filter: 'all',
    query: '',
    favs: new Set(load(KEYS.favs, [])),   // массив id товаров
    cart: load(KEYS.cart, {}),            // { [id]: количество }
  };
  let drawerMode = null;                  // 'cart' | 'favs' | null

  const $ = (sel) => document.querySelector(sel);
  const fmtPrice = (n) => n.toLocaleString('ru-RU') + ' ₽';
  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => PRODUCTS.find((p) => p.id === Number(id));
  const cartCount = () => Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = () => Object.entries(state.cart).reduce((sum, [id, qty]) => {
    const p = byId(id);
    return p ? sum + p.price * qty : sum;
  }, 0);

  function persist() {
    save(KEYS.cart, state.cart);
    save(KEYS.favs, [...state.favs]);
  }

  /* ================= Темы оформления ================= */
  // Каждая тема задаёт CSS-переменные. Имена совпадают с переменными в styles.css.
  const THEMES = [
    {
      id: 'light', name: 'Светлая', preview: ['#f3f3ef', '#0b0b0b'],
      vars: {
        'bg': '#f3f3ef', 'bg-rgb': '243, 243, 239', 'bg-2': '#ffffff',
        'surface': '#ffffff', 'surface-2': '#e9e9e4',
        'text': '#0b0b0b', 'muted': '#6b6b70',
        'border': 'rgba(0, 0, 0, 0.1)', 'border-strong': 'rgba(0, 0, 0, 0.25)',
        'accent': '#0b0b0b', 'accent-rgb': '11, 11, 11', 'on-accent': '#ffffff',
        'garment': 'rgba(0, 0, 0, 0.8)', 'garment-soft': 'rgba(0, 0, 0, 0.06)',
        'tile': '#e4e4df', 'red': '#e5262e',
      },
    },
    {
      id: 'dark', name: 'Темная', preview: ['#0c0b09', '#c9a45c'],
      vars: {
        'bg': '#0c0b09', 'bg-rgb': '12, 11, 9', 'bg-2': '#131210',
        'surface': '#181612', 'surface-2': '#221f1a',
        'text': '#efe9dc', 'muted': '#8f8778',
        'border': 'rgba(201, 164, 92, 0.18)', 'border-strong': 'rgba(201, 164, 92, 0.42)',
        'accent': '#c9a45c', 'accent-rgb': '201, 164, 92', 'on-accent': '#0c0b09',
        'garment': 'rgba(239, 233, 220, 0.9)', 'garment-soft': 'rgba(201, 164, 92, 0.08)',
        'tile': '#262219', 'red': '#b5443a',
      },
    },
    {
      id: 'blue', name: 'Голубая', preview: ['#cfe9fb', '#1f7ae0'],
      vars: {
        'bg': '#dcefff', 'bg-rgb': '220, 239, 255', 'bg-2': '#f2f9ff',
        'surface': '#ffffff', 'surface-2': '#cde6fa',
        'text': '#0c2a4a', 'muted': '#4f7192',
        'border': 'rgba(12, 42, 74, 0.12)', 'border-strong': 'rgba(12, 42, 74, 0.3)',
        'accent': '#1f7ae0', 'accent-rgb': '31, 122, 224', 'on-accent': '#ffffff',
        'garment': 'rgba(12, 42, 74, 0.85)', 'garment-soft': 'rgba(12, 42, 74, 0.07)',
        'tile': '#bfe0fa', 'red': '#ff3d6e',
      },
    },
    {
      id: 'grunge', name: 'Гранж', preview: ['#0d0d0d', '#e4ff1a'],
      vars: {
        'bg': '#0d0d0d', 'bg-rgb': '13, 13, 13', 'bg-2': '#141414',
        'surface': '#1a1a1a', 'surface-2': '#262626',
        'text': '#f7f7f2', 'muted': '#9d9d96',
        'border': 'rgba(255, 255, 255, 0.14)', 'border-strong': 'rgba(255, 255, 255, 0.35)',
        'accent': '#e4ff1a', 'accent-rgb': '228, 255, 26', 'on-accent': '#0d0d0d',
        'garment': '#f7f7f2', 'garment-soft': 'rgba(255, 255, 255, 0.1)',
        'tile': '#2b2b2b', 'red': '#ff2e63',
      },
    },
  ];
  const DEFAULT_THEME = 'dark';

  const themeToggle = $('#themeToggle');
  const themePanel = $('#themePanel');
  const themeList = $('#themeList');

  themeList.innerHTML = THEMES.map((t) =>
    `<button class="swatch" data-theme="${t.id}" aria-pressed="false" style="--sw-bg:${t.preview[0]};--sw-accent:${t.preview[1]}"><i></i>${t.name}</button>`
  ).join('');

  function applyTheme(id) {
    const t = THEMES.find((x) => x.id === id) || THEMES.find((x) => x.id === DEFAULT_THEME);
    const style = document.documentElement.style;
    Object.entries(t.vars).forEach(([name, value]) => style.setProperty(`--${name}`, value));
    document.documentElement.dataset.theme = t.id;

    themeList.querySelectorAll('.swatch').forEach((b) => {
      const active = b.dataset.theme === t.id;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    try { localStorage.setItem(KEYS.theme, t.id); } catch { /* хранилище недоступно */ }
  }

  function setThemePanel(open) {
    themePanel.classList.toggle('is-open', open);
    themeToggle.setAttribute('aria-expanded', String(open));
  }

  themeToggle.addEventListener('click', () => setThemePanel(!themePanel.classList.contains('is-open')));

  themeList.addEventListener('click', (e) => {
    const btn = e.target.closest('.swatch');
    if (btn) applyTheme(btn.dataset.theme);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#theme')) setThemePanel(false);
  });

  let savedTheme = null;
  try { savedTheme = localStorage.getItem(KEYS.theme); } catch { /* хранилище недоступно */ }
  applyTheme(savedTheme);

  /* ================= Тост ================= */
  const toastEl = $('#toast');
  let toastTimer = null;
  function showToast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
  }

  /* ================= Счётчики в шапке ================= */
  function updateBadges() {
    const cartEl = $('#cartCount');
    cartEl.textContent = cartCount();
    cartEl.classList.add('bump');
    setTimeout(() => cartEl.classList.remove('bump'), 250);

    const favEl = $('#favCount');
    favEl.textContent = state.favs.size;
    favEl.hidden = state.favs.size === 0;
  }

  /* ================= Товары: поиск + фильтр пола ================= */
  function cardHTML(p) {
    const badge = p.badge
      ? `<span class="product__badge${p.badge.startsWith('-') ? ' product__badge--sale' : ''}">${p.badge}</span>`
      : '';
    const oldPrice = p.oldPrice ? `<s>${fmtPrice(p.oldPrice)}</s>` : '';
    const isFav = state.favs.has(p.id);
    return `
      <article class="product" data-id="${p.id}">
        <div class="product__img">
          ${badge}
          <button class="product__fav${isFav ? ' is-active' : ''}" aria-label="В избранное" aria-pressed="${isFav}">
            <svg><use href="#i-heart"/></svg>
          </button>
          <svg class="garment"><use href="#${p.icon}"/></svg>
          <button class="product__add" aria-label="Добавить в корзину">
            <svg><use href="#i-cart"/></svg> В корзину
          </button>
        </div>
        <div class="product__info">
          <h3>${p.name}</h3>
          <div class="product__meta">
            <span class="product__cat">${p.cat}</span>
            <span class="product__price">${oldPrice}${fmtPrice(p.price)}</span>
          </div>
        </div>
      </article>`;
  }

  function visibleProducts() {
    const q = state.query.trim().toLowerCase();
    return PRODUCTS.filter((p) =>
      (state.filter === 'all' || p.gender === state.filter) &&
      (!q || p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q))
    );
  }

  function renderProducts() {
    const list = visibleProducts();
    $('#products').innerHTML = list.length
      ? list.map(cardHTML).join('')
      : `<p class="empty">Пусто. Попробуй другое слово${state.query.trim() ? `, «${escapeHtml(state.query.trim())}» не нашлось` : ''}.</p>`;
  }

  /* Обновляет сердечко на всех карточках этого товара (без перерисовки сетки) */
  function syncFavButtons(id) {
    document.querySelectorAll(`.product[data-id="${id}"] .product__fav`).forEach((btn) => {
      const active = state.favs.has(id);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function toggleFav(id) {
    if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
    persist();
    syncFavButtons(id);
    updateBadges();
    if (drawerMode === 'favs') renderDrawer();
  }

  function addToCart(id) {
    state.cart[id] = (state.cart[id] || 0) + 1;
    persist();
    updateBadges();
    if (drawerMode === 'cart') renderDrawer();
  }

  $('#products').addEventListener('click', (e) => {
    const card = e.target.closest('.product');
    if (!card) return;
    const id = Number(card.dataset.id);

    if (e.target.closest('.product__fav')) {
      toggleFav(id);
      return;
    }
    if (e.target.closest('.product__add')) {
      addToCart(id);
      showToast(`«${byId(id).name}» уже в корзине. Не передумывай`);
    }
  });

  $('#filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    document.querySelectorAll('.filter').forEach((b) => b.classList.toggle('is-active', b === btn));
    state.filter = btn.dataset.filter;
    renderProducts();
  });

  /* ================= Поиск ================= */
  const searchEl = $('#search');
  const searchInput = $('#searchInput');

  function openSearch() {
    searchEl.classList.add('is-open');
    setTimeout(() => searchInput.focus(), 150);
  }

  function closeSearch() {
    searchEl.classList.remove('is-open');
    if (state.query) {
      state.query = '';
      searchInput.value = '';
      renderProducts();
    }
  }

  $('#searchBtn').addEventListener('click', () => {
    if (searchEl.classList.contains('is-open')) closeSearch(); else openSearch();
  });

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    renderProducts();
  });

  /* ================= Панель корзины и избранного ================= */
  const drawer = $('#drawer');
  const overlay = $('#overlay');

  function openDrawer(mode) {
    drawerMode = mode;
    renderDrawer();
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    drawerMode = null;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function renderDrawer() {
    if (drawerMode === 'cart') renderCart();
    else if (drawerMode === 'favs') renderFavs();
    else if (drawerMode === 'checkout') renderCheckout();
    else if (drawerMode === 'success') renderSuccess();
  }

  /* ================= Оформление заказа ================= */
  const ORDERS_KEY = 'pp-orders';
  let lastOrder = null;

  function cartItems() {
    return Object.entries(state.cart)
      .map(([id, qty]) => ({ p: byId(id), qty }))
      .filter((item) => item.p);
  }

  function renderCheckout() {
    const items = cartItems();
    if (!items.length) { drawerMode = 'cart'; renderCart(); return; }

    $('#drawerTitle').textContent = 'Оформление';
    $('#drawerBody').innerHTML = `
      <form class="checkout" id="checkoutForm" novalidate>
        <label class="field">
          <span>Имя</span>
          <input name="name" autocomplete="name" placeholder="Как к вам обращаться">
        </label>
        <label class="field">
          <span>Телефон</span>
          <input name="phone" type="tel" autocomplete="tel" placeholder="+7 900 000-00-00">
        </label>
        <label class="field">
          <span>Адрес доставки</span>
          <textarea name="address" rows="3" autocomplete="street-address" placeholder="Город, улица, дом, квартира"></textarea>
        </label>
        <p class="checkout__error" id="checkoutError" role="alert"></p>
        <div class="checkout__summary">
          ${items.map(({ p, qty }) => `<div><span>${escapeHtml(p.name)} × ${qty}</span><b>${fmtPrice(p.price * qty)}</b></div>`).join('')}
        </div>
      </form>`;

    $('#drawerFoot').innerHTML = `
      <div class="drawer__total"><span>К оплате</span><strong>${fmtPrice(cartTotal())}</strong></div>
      <button class="btn btn--primary btn--block" type="submit" form="checkoutForm">Отправить</button>
      <button class="btn btn--ghost btn--block" data-back>Назад в корзину</button>`;
  }

  function validateCheckout(data) {
    const name = data.name.trim();
    const phone = data.phone.replace(/\D/g, '');
    const address = data.address.trim();
    if (name.length < 2) return 'Введите имя, хотя бы два символа';
    if (phone.length < 10) return 'Телефон должен содержать не меньше 10 цифр';
    if (address.length < 8) return 'Укажите адрес доставки: город, улицу, дом';
    return null;
  }

  // Сервер (server.js или api/order.js), который отправляет заказ в Telegram
  const ORDER_ENDPOINT = '/api/order';

  async function submitOrder(form) {
    const data = Object.fromEntries(new FormData(form));
    const error = validateCheckout(data);
    $('#checkoutError').textContent = error || '';
    if (error) { $('#checkoutError').scrollIntoView({ block: 'nearest' }); return; }

    if (location.protocol === 'file:') {
      $('#checkoutError').textContent = 'Сайт открыт как файл, поэтому заказ не отправится. Запустите node server.js и откройте http://localhost:3000';
      $('#checkoutError').scrollIntoView({ block: 'nearest' });
      return;
    }

    const order = {
      number: Date.now().toString().slice(-6),
      date: new Date().toLocaleString('ru-RU'),
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      items: cartItems().map(({ p, qty }) => ({ id: p.id, name: p.name, price: p.price, qty })),
      total: cartTotal(),
    };

    const btn = document.querySelector('button[form="checkoutForm"]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    try {
      const res = await fetch(ORDER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'server error');
    } catch (err) {
      $('#checkoutError').textContent = `Не получилось отправить заказ${err && err.message ? ` (${err.message})` : ''}. Проверьте интернет и нажмите «Отправить» ещё раз.`;
      $('#checkoutError').scrollIntoView({ block: 'nearest' });
      btn.disabled = false;
      btn.textContent = 'Отправить';
      return;
    }

    // Заказ ушёл в Telegram: сохраняем копию в браузере и очищаем корзину
    lastOrder = order;
    save(ORDERS_KEY, [...load(ORDERS_KEY, []), lastOrder]);

    state.cart = {};
    persist();
    updateBadges();
    drawerMode = 'success';
    renderSuccess();
  }

  function renderSuccess() {
    if (!lastOrder) { drawerMode = 'cart'; renderCart(); return; }
    const o = lastOrder;
    $('#drawerTitle').textContent = 'Заявка принята';
    $('#drawerBody').innerHTML = `
      <div class="success">
        <span class="success__mark">✓</span>
        <h4>Спасибо за заказ!</h4>
        <p>Мы получили вашу заявку. Менеджер свяжется с вами в течение 15 минут для подтверждения.</p>
        <p class="success__note">Спасибо за заказ! Наш менеджер свяжется с вами в Телеграм для подтверждения и оплаты (СБП / перевод).</p>
        <p class="success__meta">Заказ № ${o.number} · ${escapeHtml(o.name)} · ${escapeHtml(o.phone)}</p>
      </div>`;
    $('#drawerFoot').innerHTML = `<button class="btn btn--ghost btn--block" data-close>Назад в каталог</button>`;
  }

  function renderCart() {
    const items = Object.entries(state.cart)
      .map(([id, qty]) => ({ p: byId(id), qty }))
      .filter((item) => item.p);

    $('#drawerTitle').textContent = `Корзина (${cartCount()})`;
    $('#drawerBody').innerHTML = items.length
      ? items.map(({ p, qty }) => `
        <div class="cart-item" data-id="${p.id}">
          <div class="cart-item__img"><svg><use href="#${p.icon}"/></svg></div>
          <div class="cart-item__info">
            <strong>${p.name}</strong>
            <span>${fmtPrice(p.price)}</span>
            <div class="qty">
              <button data-act="dec" aria-label="Уменьшить количество">−</button>
              <span>${qty}</span>
              <button data-act="inc" aria-label="Увеличить количество">+</button>
            </div>
          </div>
          <div class="cart-item__side">
            <b>${fmtPrice(p.price * qty)}</b>
            <button class="link-btn link-btn--danger" data-act="remove">Убрать</button>
          </div>
        </div>`).join('')
      : '<p class="empty">Пока пусто. Самое время что-нибудь забрать</p>';

    $('#drawerFoot').innerHTML = items.length
      ? `<div class="drawer__total"><span>К оплате</span><strong>${fmtPrice(cartTotal())}</strong></div>
         <button class="btn btn--primary btn--block" data-checkout>Оформить заказ</button>
         <button class="btn btn--ghost btn--block" data-close>Ещё покупок</button>`
      : `<button class="btn btn--ghost btn--block" data-close>Назад в каталог</button>`;
  }

  function renderFavs() {
    const items = [...state.favs].map(byId).filter(Boolean);

    $('#drawerTitle').textContent = `Избранное (${items.length})`;
    $('#drawerBody').innerHTML = items.length
      ? items.map((p) => `
        <div class="cart-item" data-id="${p.id}">
          <div class="cart-item__img"><svg><use href="#${p.icon}"/></svg></div>
          <div class="cart-item__info">
            <strong>${p.name}</strong>
            <span>${fmtPrice(p.price)}</span>
          </div>
          <div class="cart-item__side">
            <button class="link-btn" data-act="addcart">В корзину</button>
            <button class="link-btn link-btn--danger" data-act="unfav">Убрать</button>
          </div>
        </div>`).join('')
      : '<p class="empty">Тут пока ничего не лайкнули</p>';

    $('#drawerFoot').innerHTML = `<button class="btn btn--ghost btn--block" data-close>Назад в каталог</button>`;
  }

  /* Действия внутри панели: количество, удаление, добавление из избранного */
  $('#drawerBody').addEventListener('click', (e) => {
    const row = e.target.closest('[data-id]');
    const btn = e.target.closest('[data-act]');
    if (!row || !btn) return;
    const id = Number(row.dataset.id);

    switch (btn.dataset.act) {
      case 'inc':
        state.cart[id] = (state.cart[id] || 0) + 1;
        break;
      case 'dec':
        state.cart[id] = (state.cart[id] || 1) - 1;
        if (state.cart[id] <= 0) delete state.cart[id];
        break;
      case 'remove':
        delete state.cart[id];
        break;
      case 'addcart':
        addToCart(id);
        showToast(`«${byId(id).name}» уже в корзине. Не передумывай`);
        return;
      case 'unfav':
        toggleFav(id);
        return;
      default:
        return;
    }
    persist();
    updateBadges();
    renderDrawer();
  });

  $('#drawerFoot').addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeDrawer();
    else if (e.target.closest('[data-checkout]')) { drawerMode = 'checkout'; renderDrawer(); }
    else if (e.target.closest('[data-back]')) { drawerMode = 'cart'; renderDrawer(); }
  });

  drawer.addEventListener('submit', (e) => {
    if (e.target.id !== 'checkoutForm') return;
    e.preventDefault();
    submitOrder(e.target);
  });

  $('#cartBtn').addEventListener('click', () => openDrawer('cart'));
  $('#favBtn').addEventListener('click', () => openDrawer('favs'));
  $('#drawerClose').addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (drawerMode) closeDrawer();
    else if (searchEl.classList.contains('is-open')) closeSearch();
    else setThemePanel(false);
  });

  /* ================= Шапка и мобильное меню ================= */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger');
  const nav = $('#nav');
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    nav.classList.toggle('is-open');
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      burger.classList.remove('is-open');
      nav.classList.remove('is-open');
    }
  });

  /* ================= Подписка ================= */
  $('#newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    $('#newsletterMsg').textContent = 'Готово. PRIME10 уже летит на почту.';
    e.target.reset();
  });

  /* ================= Появление блоков при прокрутке ================= */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ================= Старт ================= */
  renderProducts();
  updateBadges();
})();
