/* MQTT over WebSocket —— 连接、心跳、断线重连。浏览器里唯一碰网络的模块。
 *
 * 依赖注入 createSocket / now / timers，Node 里可以用假 socket 把重连和
 * 心跳逻辑完整测一遍，不需要真 broker。
 *
 * 状态机：
 *   idle -> connecting -> connected
 *          ^                |
 *          |                v
 *       reconnecting <-(断开/心跳超时)
 *   rc != 0 的 CONNACK 是配置问题（认证/参数），直接 fatal，不无限重试。
 *   小程序切后台 / 手机锁屏会让 WebSocket 直接被杀，所以重连不能靠
 *   socket 的 onclose 可靠触发 —— 页面 onShow 时调用 kick() 主动检查。
 */
(function (root) {
  'use strict';

  var M = root.MQTT311 ||
    (typeof require === 'function' ? require('./mqtt311.js') : null);

  var BACKOFF_MS = [1000, 2000, 4000, 8000, 15000, 30000];

  function Client(options) {
    var o = options || {};
    this.url = o.url;
    this.clientId = o.clientId || ('nanopi-web-' + Math.random().toString(16).slice(2, 10));
    this.keepalive = o.keepalive == null ? 60 : o.keepalive;
    this.connectTimeout = o.connectTimeout == null ? 10000 : o.connectTimeout;
    this.filters = o.filters || [];

    this.createSocket = o.createSocket || defaultCreateSocket;
    this.now = o.now || function () { return Date.now(); };
    this.setTimer = o.setTimer || function (fn, ms) { return setTimeout(fn, ms); };
    this.clearTimer = o.clearTimer || function (id) { clearTimeout(id); };

    this.onState = o.onState || function () {};
    this.onMessage = o.onMessage || function () {};
    this.onError = o.onError || function () {};

    this.state = 'idle';
    this.attempt = 0;
    this.lastError = null;
    this._socket = null;
    this._reader = new M.Reader();
    this._packetId = 1;
    this._reconnectTimer = null;
    this._pingTimer = null;
    this._timeoutTimer = null;
    this._lastRxAt = 0;
    this._wantConnected = false;
  }

  function defaultCreateSocket(url) {
    /* 第二个参数必须带 mqtt 子协议，公用的 EMQX / mosquitto 都按它分流 */
    return new WebSocket(url, ['mqtt']);
  }

  Client.prototype._setState = function (state, detail) {
    this.state = state;
    this.onState(state, detail || {});
  };

  Client.prototype.connect = function () {
    this._wantConnected = true;
    if (this.state === 'connecting' || this.state === 'connected') return;
    this._open();
  };

  /* 页面重新可见时调用：socket 已经被系统杀掉的场景下 onclose 不一定触发。 */
  Client.prototype.kick = function () {
    if (!this._wantConnected) return;
    if (this.state === 'connected' || this.state === 'connecting') {
      if (this.now() - this._lastRxAt > this.keepalive * 1500) this._drop('心跳超时');
      return;
    }
    if (this.state === 'fatal') return;
    this._cancelReconnect();
    this._open();
  };

  Client.prototype.disconnect = function () {
    this._wantConnected = false;
    this._cancelReconnect();
    this._stopHeartbeat();
    var sock = this._socket;
    this._socket = null;
    if (sock) {
      try { sock.send(M.encodeDisconnect()); } catch (e) { /* 已经断了 */ }
      try { sock.close(); } catch (e) { /* 已经断了 */ }
    }
    this._clearConnectTimeout();
    this._setState('idle');
  };

  Client.prototype.subscribe = function (filters) {
    if (filters) this.filters = filters;
    if (this.state !== 'connected') return false;
    var id = this._nextId();
    this._socket.send(M.encodeSubscribe(id, this.filters));
    return true;
  };

  Client.prototype._nextId = function () {
    this._packetId = this._packetId >= 0xffff ? 1 : this._packetId + 1;
    return this._packetId;
  };

  Client.prototype._open = function () {
    this._setState(this.attempt === 0 ? 'connecting' : 'reconnecting',
                   { attempt: this.attempt });
    var sock;
    try {
      sock = this.createSocket(this.url);
    } catch (e) {
      return this._fail(e);
    }
    this._socket = sock;
    this._reader = new M.Reader();
    this._lastRxAt = this.now();

    sock.binaryType = 'arraybuffer';
    /* 超时要从建 socket 就开始算：TLS/WebSocket 握手本身也可能卡死，
     * 那种情况下 onopen 永远不会来。 */
    this._startConnectTimeout();
    sock.onopen = function () {
      if (this._socket !== sock) return;
      try {
        sock.send(M.encodeConnect({clientId: this.clientId, keepalive: this.keepalive}));
      } catch (e) {
        this._drop(String(e && e.message || e));
      }
    }.bind(this);

    sock.onmessage = function (evt) {
      if (this._socket !== sock) return;
      this._lastRxAt = this.now();
      var packets;
      try {
        packets = this._reader.push(evt.data);
      } catch (e) {
        return this._drop('报文解析失败: ' + (e && e.message || e));
      }
      for (var i = 0; i < packets.length; i++) this._handle(packets[i]);
    }.bind(this);

    sock.onerror = function () {
      if (this._socket !== sock) return;
      /* 浏览器出于安全不给具体原因，只说"出错了"；真正的判断交给 onclose */
      this.onError(new Error('网络错误'));
    }.bind(this);

    sock.onclose = function (evt) {
      if (this._socket !== sock) return;
      this._drop('连接关闭' + (evt && evt.code ? '（' + evt.code + '）' : ''));
    }.bind(this);
  };

  Client.prototype._handle = function (pkt) {
    if (!pkt) return;
    if (pkt.type === M.TYPE.CONNACK) {
      this._clearConnectTimeout();
      if (pkt.returnCode !== 0) return this._fatal(connackReason(pkt.returnCode));
      this.attempt = 0;
      this._setState('connected');
      this._startHeartbeat();
      /* 连上就订阅：retain 消息会立刻把全量快照推回来 */
      var id = this._nextId();
      this._socket.send(M.encodeSubscribe(id, this.filters));
      return;
    }
    if (pkt.type === M.TYPE.PUBLISH) {
      this.onMessage(pkt.topic, pkt.payload, {retain: pkt.retain});
      return;
    }
    if (pkt.type === M.TYPE.SUBACK) {
      this.onState('connected', {subscribed: true});
      return;
    }
    /* PINGRESP 等：收到任意报文就已经刷新了 _lastRxAt，无需处理 */
  };

  Client.prototype._startConnectTimeout = function () {
    this._clearConnectTimeout();
    var self = this;
    this._timeoutTimer = this.setTimer(function () {
      self._timeoutTimer = null;
      self._drop('连接超时');
    }, this.connectTimeout);
  };

  Client.prototype._clearConnectTimeout = function () {
    if (this._timeoutTimer) {
      this.clearTimer(this._timeoutTimer);
      this._timeoutTimer = null;
    }
  };

  Client.prototype._startHeartbeat = function () {
    var self = this;
    this._stopHeartbeat();
    var period = Math.max(5, Math.floor(this.keepalive * 1000 / 2));
    this._pingTimer = this.setTimer(function tick() {
      if (self.state !== 'connected') return;
      var silentFor = self.now() - self._lastRxAt;
      if (silentFor > self.keepalive * 1500) {
        self._drop('心跳超时');
        return;
      }
      try { self._socket.send(M.encodePingreq()); } catch (e) { return self._drop('发送失败'); }
      self._pingTimer = self.setTimer(tick, period);
    }, period);
  };

  Client.prototype._stopHeartbeat = function () {
    if (this._pingTimer) {
      this.clearTimer(this._pingTimer);
      this._pingTimer = null;
    }
  };

  /* 非致命断开：排一次重连 */
  Client.prototype._drop = function (reason) {
    this._closeSocket();
    this._stopHeartbeat();
    this._clearConnectTimeout();
    if (!this._wantConnected) return this._setState('idle');
    this.lastError = reason;
    var delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)];
    this.attempt += 1;
    this._setState('reconnecting', {attempt: this.attempt, reason: reason, retryInMs: delay});
    var self = this;
    this._cancelReconnect();
    this._reconnectTimer = this.setTimer(function () {
      self._reconnectTimer = null;
      self._open();
    }, delay);
  };

  /* 致命错误：参数/认证问题，重连也没用，别把手机电池耗在这上面 */
  Client.prototype._fatal = function (reason) {
    this._closeSocket();
    this._stopHeartbeat();
    this._clearConnectTimeout();
    this._cancelReconnect();
    this._wantConnected = false;
    this.lastError = reason;
    this._setState('fatal', {reason: reason});
  };

  Client.prototype._fail = function (e) {
    this._drop(String(e && e.message || e));
  };

  Client.prototype._closeSocket = function () {
    var sock = this._socket;
    this._socket = null;
    if (!sock) return;
    sock.onopen = sock.onmessage = sock.onerror = sock.onclose = null;
    try { sock.close(); } catch (e) { /* 已经断了 */ }
  };

  Client.prototype._cancelReconnect = function () {
    if (this._reconnectTimer) {
      this.clearTimer(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  };

  function connackReason(rc) {
    var reasons = {
      1: '服务器不支持该协议版本',
      2: '客户端 ID 被拒绝',
      3: '服务不可用',
      4: '用户名或密码错误',
      5: '未授权'
    };
    return reasons[rc] || ('连接被拒绝（返回码 ' + rc + '）');
  }

  var api = {Client: Client, BACKOFF_MS: BACKOFF_MS, connackReason: connackReason};

  root.MQTTClient = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
