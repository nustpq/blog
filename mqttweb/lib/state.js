/* 设备状态聚合：把一条条 (topic, payload) 归到一个前缀下。
 *
 * 纯逻辑，不碰网络也不碰 DOM —— app.js 负责连 WebSocket，把报文喂进来，
 * 再把快照渲染成卡片。这样断线重连、retain 覆盖、多设备这些容易出错的
 * 地方都能在 PC 上直接测。
 *
 * prefix 是用户填的「路径」，例：nustpq/nanopi
 * 实际订阅 prefix + '/stat/#'，只收指标，不收同级的人工查看用 status。
 */
(function (root) {
  'use strict';

  var Fields = root.Fields || (typeof require === 'function' ? require('./fields.js') : null);

  /* 把 "nustpq/nanopi/" / " nustpq/nanopi/stat " 之类统一成规范前缀。
   * 用户可能粘贴完整订阅路径，也可能只填命名空间 —— 两种都接受。 */
  function normalizePrefix(input) {
    var p = String(input == null ? '' : input).trim();
    p = p.replace(/^mqtts?:\/\//i, '');       // 误粘贴完整 URL
    p = p.replace(/^wss?:\/\//i, '');
    p = p.replace(/^[^\/]*\//, function (m) {
      /* 只有首段带端口/主机名时才切掉 */
      return /[:.]/.test(m) ? '' : m;
    });
    p = p.replace(/\/+$/, '');
    /* 用户填了 .../nanopi/stat 时，去掉尾部 /stat，避免订阅成 /stat/stat/# */
    p = p.replace(/\/stat$/, '');
    return p;
  }

  function statFilter(prefix) {
    return normalizePrefix(prefix) + '/stat/#';
  }

  /* 前缀 -> 订阅通配符（"nustpq/nanopi/stat/#"）-> 字段后缀 */
  function topicToKey(prefix, topic) {
    var base = normalizePrefix(prefix) + '/stat/';
    if (topic.indexOf(base) !== 0) return null;
    var key = topic.slice(base.length);
    if (!key || key.indexOf('/') !== -1) return null;   // 不收更深层级
    return key;
  }

  function createDevice(prefix) {
    return {
      prefix: normalizePrefix(prefix),
      values: {},
      received: 0,
      lastMessageAt: null
    };
  }

  /* 喂一条消息；返回是否被这个设备消费掉。 */
  function accept(device, topic, payload, nowMs) {
    var key = topicToKey(device.prefix, topic);
    if (key === null) return false;
    device.values[key] = payload;
    device.received += 1;
    device.lastMessageAt = nowMs;
    return true;
  }

  /* 卡片视图模型：把原始字段和展示行合在一起，供 app.js 直接渲染。 */
  function view(device, nowSec) {
    var type = Fields.identify(device.values);
    var detail = Fields.describe(type, device.values);
    var fresh = Fields.freshness(device.values.ts, nowSec);
    return {
      prefix: device.prefix,
      type: type,
      host: detail.host,
      ip: detail.ip,
      rows: detail.rows,
      fresh: fresh,
      /* 一条消息都没收到（可能前缀填错 / broker 上没数据） */
      empty: device.received === 0
    };
  }

  var api = {
    normalizePrefix: normalizePrefix,
    statFilter: statFilter,
    topicToKey: topicToKey,
    createDevice: createDevice,
    accept: accept,
    view: view
  };

  root.Store = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
