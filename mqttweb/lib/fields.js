/* 字段口径：把 MQTT 收到的 {topic 后缀: 字符串} 变成看板能画的卡片数据。
 *
 * 不碰 DOM、不碰 wx —— 浏览器和 Node 里都能跑，测试直接 require。
 *
 * 三条约定（与 tools/nanopi/README.md、主程序保持一致）：
 * - 抓不到的数值一律发 "-1" 哨兵，显示成 "--"，**不显示 -1%**
 * - 磁盘百分比是 df 口径 used/(used+avail)，采集端算好，这里只负责显示
 * - 单位换算只做一次：uptime 秒 -> 人话；其它原样带单位
 */
(function (root) {
  'use strict';

  var SENTINEL = '-1';
  var STALE_SEC = 180;        // 采集端每分钟一轮，连续 3 轮没新数据算陈旧

  /* 百分比类：kind=meter，带阈值配色 */
  var PERCENT_METRICS = {
    cpu: { label: 'CPU', warn: 75, crit: 90 },
    mem: { label: '内存', warn: 75, crit: 90 },
    disk: { label: '磁盘', warn: 75, crit: 90 }
  };

  var TEMP_METRIC = { label: '温度', warn: 70, crit: 80 };

  /* 设备类型：按字段集合识别，用户添加时不需要选型号。
   * 判据取自两边 publish 的字段差异（见各目录下的 README）。 */
  function identify(values) {
    var v = values || {};
    if ('load1' in v || 'disk_total' in v) return 'nanopi';
    if ('mem' in v || 'mem_free' in v) return 't440';
    return 'generic';
  }

  function isNum(str) {
    return str !== undefined && str !== null && str !== '' &&
      isFinite(Number(str));
  }

  /* "-1" 哨兵 / 缺失 / 非数字 -> null，调用方显示 "--" */
  function num(values, key) {
    if (!isNum(values[key])) return null;
    var n = Number(values[key]);
    return n < 0 ? null : n;
  }

  function severity(pct, warn, crit) {
    if (pct === null) return 'none';
    if (pct >= crit) return 'critical';
    if (pct >= warn) return 'warning';
    return 'good';
  }

  function formatUptime(seconds) {
    var s = Math.floor(Number(seconds));
    if (!isFinite(s) || s < 0) return '--';
    if (s < 60) return '不到 1 分钟';
    var days = Math.floor(s / 86400);
    var hours = Math.floor((s % 86400) / 3600);
    var minutes = Math.floor((s % 3600) / 60);
    if (days > 0) return days + ' 天 ' + hours + ' 小时';
    if (hours > 0) return hours + ' 小时 ' + minutes + ' 分';
    return minutes + ' 分钟';
  }

  function formatAgo(seconds) {
    var s = Math.floor(Number(seconds));
    if (!isFinite(s) || s < 0) return '--';
    if (s < 60) return s + ' 秒前';
    if (s < 3600) return Math.floor(s / 60) + ' 分钟前';
    if (s < 86400) return Math.floor(s / 3600) + ' 小时前';
    return Math.floor(s / 86400) + ' 天前';
  }

  /* 数据新鲜度：用采集端的 ts 与本地时钟的差判断。
   * 手机时钟可能偏，所以调用方要把这个「差值」展示给用户看（"3 分钟前"），
   * 而不是悄悄隐藏 —— 用户能自己分辨是数据旧还是时钟不准。 */
  function freshness(ts, nowSec) {
    if (!isNum(ts)) return { age: null, stale: true, label: '无时间戳' };
    var age = Math.floor(Number(nowSec) - Number(ts));
    if (age < 0) age = 0;      // 采集端时钟略快于手机，不算未来数据
    return {
      age: age,
      stale: age > STALE_SEC,
      label: formatAgo(age)
    };
  }

  /* 卡片正文：一条一条按固定顺序排，未知字段垫底平铺。
   * 返回的每一项都给好了 label / 显示值 / 进度条百分比，渲染层不做判断。 */
  function describe(type, values, opts) {
    var v = values || {};
    var o = opts || {};
    var rows = [];

    if (type === 'nanopi') {
      pushPercent(rows, v, 'cpu');
      pushText(rows, '负载', [v.load1, v.load5, v.load15], function (parts) {
        return parts.map(function (p) {
          return isNum(p) && Number(p) >= 0 ? Number(p).toFixed(2) : '--';
        }).join('  /  ');
      });
      pushTemp(rows, v);
      pushPercent(rows, v, 'disk');
      pushDisk(rows, v);
      pushUptime(rows, v);
    } else if (type === 't440') {
      pushPercent(rows, v, 'cpu');
      pushPercent(rows, v, 'mem');
      pushText(rows, '内存明细', [v.mem_free], function (parts) {
        return parts[0] ? parts[0] + ' GB' : '--';
      });
      pushPercent(rows, v, 'disk');
      pushText(rows, '磁盘剩余', [v.disk_free], function (parts) {
        return parts[0] && parts[0] !== SENTINEL ? parts[0] + ' GB' : '--';
      });
      pushTemp(rows, v);
      pushUptime(rows, v);
    } else {
      /* 通用：认得出来的按百分比画，其余平铺 */
      var known = {};
      Object.keys(PERCENT_METRICS).forEach(function (key) {
        if (key in v) {
          pushPercent(rows, v, key);
          known[key] = true;
        }
      });
      if ('temp' in v) {
        pushTemp(rows, v);
        known.temp = true;
      }
      if ('uptime' in v) {
        pushUptime(rows, v);
        known.uptime = true;
      }
      Object.keys(v).sort().forEach(function (key) {
        if (known[key] || key === 'ts') return;
        pushText(rows, key, [v[key]], function (parts) {
          return parts[0] === undefined || parts[0] === SENTINEL ? '--' : String(parts[0]);
        });
      });
    }

    /* host / ip 这类身份信息放在卡片抬头，不占正文行 */
    return {
      type: type,
      host: v.host || '',
      ip: v.ip || '',
      rows: rows
    };

    function pushPercent(list, src, key) {
      var meta = PERCENT_METRICS[key];
      var pct = num(src, key);
      list.push({
        key: key,
        kind: 'meter',
        label: meta.label,
        value: pct === null ? '--' : (Math.round(pct * 10) / 10) + '%',
        percent: pct === null ? 0 : Math.max(0, Math.min(100, pct)),
        level: severity(pct, meta.warn, meta.crit)
      });
    }

    function pushTemp(list, src) {
      var t = num(src, 'temp');
      /* 温度不是比例，不能画成百分比进度条（24℃ 画成 24% 是假的）。
       * 只在数值上着色：超过 70℃ 偏暖，80℃ 算过热。 */
      list.push({
        key: 'temp',
        kind: 'text',
        label: TEMP_METRIC.label,
        value: t === null ? '--' : Math.round(t) + ' ℃',
        level: severity(t, TEMP_METRIC.warn, TEMP_METRIC.crit)
      });
    }

    function pushText(list, label, parts, fmt) {
      list.push({
        key: label,
        kind: 'text',
        label: label,
        value: fmt(parts)
      });
    }

    function pushDisk(list, src) {
      var free = num(src, 'disk_free');
      var total = num(src, 'disk_total');
      list.push({
        key: 'disk_gb',
        kind: 'text',
        label: '磁盘容量',
        value: free === null || total === null
          ? '--'
          : free.toFixed(1) + ' / ' + total.toFixed(1) + ' GB'
      });
    }

    function pushUptime(list, src) {
      var up = num(src, 'uptime');
      list.push({
        key: 'uptime',
        kind: 'text',
        label: '运行时长',
        /* 采集端约定：读不到 /proc/uptime 时发 0（不是 -1），
         * 所以 0 要显示成 "--" 而不是"不到 1 分钟" */
        value: up === null || up === 0 ? '--' : formatUptime(up)
      });
    }
  }

  var api = {
    SENTINEL: SENTINEL,
    STALE_SEC: STALE_SEC,
    identify: identify,
    num: num,
    severity: severity,
    formatUptime: formatUptime,
    formatAgo: formatAgo,
    freshness: freshness,
    describe: describe
  };

  root.Fields = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
