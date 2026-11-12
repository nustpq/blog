/* 看板主逻辑：把 lib/ 的纯逻辑接到 DOM 上。
 *
 * 只有这一层碰浏览器 API（WebSocket、localStorage、setInterval、DOM）。
 * 所有判断都在 lib/ 里，那边有 Node 测试覆盖。
 */
(function () {
  'use strict';

  var Store = window.Store;
  var Fields = window.Fields;
  var MQTTClient = window.MQTTClient;

  var LS_KEY = 'nanopi-dashboard-v1';
  var DEFAULTS = {
    url: 'wss://broker.emqx.io:8084/mqtt',
    /* 三台都在 nustpq/ 下：本板 nanoPi、Odroid N2（paho1 脚本）、T440 */
    prefixes: ['nustpq/nanopi', 'nustpq/n2', 'nustpq/t440']
  };

  var config = load();
  var devices = config.prefixes.map(Store.createDevice);
  var client = null;
  var lastState = {state: 'idle'};
  var clockTimer = null;

  /* ---------------------------------------------------------------- 配置 */
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return cloneDefaults();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return cloneDefaults();
      return {
        url: parsed.url || DEFAULTS.url,
        prefixes: Array.isArray(parsed.prefixes) && parsed.prefixes.length
          ? parsed.prefixes : DEFAULTS.prefixes.slice()
      };
    } catch (e) {
      return cloneDefaults();
    }
  }

  function cloneDefaults() {
    return {url: DEFAULTS.url, prefixes: DEFAULTS.prefixes.slice()};
  }

  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(config));
    } catch (e) { /* 隐私模式禁用 storage，忽略 */ }
  }

  /* ---------------------------------------------------------------- 连接 */
  function connect() {
    if (client) client.disconnect();
    devices = config.prefixes.map(Store.createDevice);
    render();

    if (!config.prefixes.length) {
      setStatus('idle', '还没有添加设备');
      return;
    }

    var filters = config.prefixes.map(Store.statFilter);
    client = new MQTTClient.Client({
      url: config.url,
      clientId: 'nanopi-web-' + Math.random().toString(16).slice(2, 10),
      keepalive: 60,
      filters: filters,
      onState: function (state, detail) {
        lastState = {state: state, detail: detail || {}};
        renderStatus();
      },
      onMessage: function (topic, payload) {
        var touched = false;
        for (var i = 0; i < devices.length; i++) {
          if (Store.accept(devices[i], topic, payload, Date.now())) touched = true;
        }
        if (touched) render();
      },
      onError: function () { /* onclose 会带着原因进来 */ }
    });
    client.connect();
    startClock();
  }

  function startClock() {
    if (clockTimer) return;
    /* 每秒重画一次「x 秒前」和新鲜度；卡片结构不变，只是文字在变 */
    clockTimer = setInterval(render, 1000);
  }

  /* ---------------------------------------------------------------- 渲染 */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderStatus() {
    var box = document.getElementById('status');
    var state = lastState.state;
    var detail = lastState.detail || {};
    box.className = 'status status-' + state;
    var text = '未连接';
    if (state === 'connecting') text = '连接中…';
    else if (state === 'connected') text = '已连接';
    else if (state === 'reconnecting') {
      text = '重连中（第 ' + (detail.attempt || 1) + ' 次，' +
             Math.round((detail.retryInMs || 1000) / 1000) + ' 秒后）';
      if (detail.reason) text += ' · ' + detail.reason;
    } else if (state === 'fatal') text = '连不上：' + (detail.reason || '');
    else if (state === 'idle') text = '未连接';
    box.textContent = text;
  }

  function meterLevelClass(level) {
    return level === 'critical' ? 'crit' : level === 'warning' ? 'warn' : '';
  }

  function renderCard(device, index) {
    var v = Store.view(device, Math.floor(Date.now() / 1000));
    var card = el('section', 'card');
    if (v.empty) card.classList.add('card-empty');
    if (v.fresh.stale) card.classList.add('card-stale');

    var head = el('header', 'card-head');
    var title = el('div', 'card-title');
    title.appendChild(el('h2', null, v.host || device.prefix));
    title.appendChild(el('span', 'card-prefix', device.prefix));
    head.appendChild(title);

    var right = el('div', 'card-meta');
    if (v.ip) right.appendChild(el('span', 'card-ip', v.ip));
    right.appendChild(el('span',
      'card-fresh' + (v.fresh.stale ? ' stale' : ''),
      v.empty ? '没有数据' : '更新于 ' + v.fresh.label));
    head.appendChild(right);
    card.appendChild(head);

    if (v.empty) {
      var hint = el('p', 'empty-hint',
        '订阅了 ' + Store.statFilter(device.prefix) + '，暂时没有收到任何消息。');
      card.appendChild(hint);
    } else {
      var list = el('div', 'rows');
      v.rows.forEach(function (row) {
        list.appendChild(renderRow(row));
      });
      card.appendChild(list);
    }

    var foot = el('footer', 'card-foot');
    var del = el('button', 'link danger', '移除');
    del.type = 'button';
    del.addEventListener('click', function () {
      config.prefixes.splice(index, 1);
      save();
      connect();
    });
    foot.appendChild(del);
    card.appendChild(foot);
    return card;
  }

  function renderRow(row) {
    var level = meterLevelClass(row.level);
    var line = el('div', 'row row-' + row.kind);
    line.appendChild(el('span', 'row-label', row.label));

    if (row.kind === 'meter') {
      var track = el('div', 'track');
      var fill = el('div', 'fill');
      fill.style.width = row.percent + '%';
      if (level) fill.className += ' ' + level;
      track.appendChild(fill);
      line.appendChild(track);
      line.appendChild(el('span', 'row-value ' + (level || ''), row.value));
      /* 进度条是纯装饰，数值已经写在旁边；给读屏一个完整句子 */
      line.setAttribute('aria-label', row.label + ' ' + row.value);
    } else {
      line.appendChild(el('span', 'row-value ' + (level || ''), row.value));
    }
    return line;
  }

  function render() {
    var root = document.getElementById('cards');
    root.textContent = '';
    if (!devices.length) {
      root.appendChild(el('p', 'empty-hint', '先在上面填一个 MQTT 路径，例如 nustpq/nanopi'));
      return;
    }
    devices.forEach(function (d, i) { root.appendChild(renderCard(d, i)); });
  }

  /* ---------------------------------------------------------------- 表单 */
  function setupForm() {
    var urlInput = document.getElementById('broker-url');
    var pathInput = document.getElementById('path-input');
    var form = document.getElementById('add-form');
    urlInput.value = config.url;

    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var raw = pathInput.value.trim();
      if (!raw) return;
      var prefix = Store.normalizePrefix(raw);
      if (!prefix) { pathInput.value = ''; return; }
      if (config.prefixes.indexOf(prefix) === -1) config.prefixes.push(prefix);
      pathInput.value = '';
      config.url = urlInput.value.trim() || DEFAULTS.url;
      save();
      connect();
    });

    urlInput.addEventListener('change', function () {
      config.url = urlInput.value.trim() || DEFAULTS.url;
      save();
      connect();
    });

    document.getElementById('reconnect').addEventListener('click', function () {
      if (client) client.kick(); else connect();
    });

    document.getElementById('theme').addEventListener('click', function () {
      var root = document.documentElement;
      var dark = root.getAttribute('data-theme') === 'dark';
      root.setAttribute('data-theme', dark ? 'light' : 'dark');
      try { localStorage.setItem(LS_KEY + '-theme', dark ? 'light' : 'dark'); } catch (e) {}
    });

    try {
      var theme = localStorage.getItem(LS_KEY + '-theme');
      if (theme) document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  }

  /* ------------------------------------------------------------ 生命周期 */
  /* 手机锁屏 / 切后台会把 WebSocket 悄悄杀掉，onclose 不一定触发。
   * 回到前台必须主动检查一次，否则页面会一直显示旧数据。 */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    if (client) client.kick();
    render();
  });

  window.addEventListener('online', function () { if (client) client.kick(); });
  window.addEventListener('beforeunload', function () { if (client) client.disconnect(); });

  setupForm();
  connect();
}());
