/* MQTT 3.1.1 报文编解码 —— 只覆盖看板用得到的几种报文。
 *
 * 传输层交给浏览器（WebSocket 已经做好 TLS 和分帧），这里只负责把
 * 字节读写正确。刻意不用 mqtt.js：那边依赖 Buffer/process，浏览器里
 * 要额外打包 polyfill，而我们要的只有 CONNECT / SUBSCRIBE / PUBLISH /
 * PING 四种报文。
 *
 * 浏览器里挂到 globalThis.MQTT311；Node 里直接 require。
 */
(function (root) {
  'use strict';

  var TYPE = {
    CONNECT: 1, CONNACK: 2, PUBLISH: 3, PUBACK: 4,
    SUBSCRIBE: 8, SUBACK: 9, PINGREQ: 12, PINGRESP: 13, DISCONNECT: 14
  };

  var encoder = new TextEncoder();
  var decoder = new TextDecoder();

  function toBytes(chunk) {
    if (chunk instanceof Uint8Array) return chunk;
    if (chunk instanceof ArrayBuffer) return new Uint8Array(chunk);
    if (ArrayBuffer.isView(chunk)) {
      return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    }
    if (Array.isArray(chunk)) return Uint8Array.from(chunk);
    throw new TypeError('cannot convert to bytes: ' + typeof chunk);
  }

  function concat(chunks) {
    var total = 0, i;
    for (i = 0; i < chunks.length; i++) total += chunks[i].length;
    var out = new Uint8Array(total);
    var off = 0;
    for (i = 0; i < chunks.length; i++) {
      out.set(chunks[i], off);
      off += chunks[i].length;
    }
    return out;
  }

  /* 剩余长度：7 位一组，最高位表示「后面还有」。最多 4 字节（256MB）。 */
  function encodeVarint(n) {
    if (!(n >= 0 && n <= 268435455)) throw new RangeError('bad length: ' + n);
    var out = [];
    do {
      var digit = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) digit = digit | 0x80;
      out.push(digit);
    } while (n > 0);
    return Uint8Array.from(out);
  }

  /* 返回 {value, length}；字节不够时返回 null（调用方应继续等数据）。 */
  function decodeVarint(bytes, offset) {
    var value = 0, multiplier = 1, i = offset;
    for (var n = 0; n < 4; n++) {
      if (i >= bytes.length) return null;
      var digit = bytes[i++];
      value += (digit & 0x7f) * multiplier;
      if ((digit & 0x80) === 0) return { value: value, length: i - offset };
      multiplier *= 128;
    }
    throw new RangeError('malformed remaining length');
  }

  /* MQTT 字符串：2 字节大端长度 + UTF-8 正文。 */
  function encodeString(str) {
    var body = encoder.encode(String(str));
    if (body.length > 65535) throw new RangeError('string too long for MQTT');
    return concat([Uint8Array.from([body.length >> 8, body.length & 0xff]), body]);
  }

  function decodeString(bytes, offset) {
    if (bytes.length < offset + 2) return null;
    var len = (bytes[offset] << 8) | bytes[offset + 1];
    if (bytes.length < offset + 2 + len) return null;
    return {
      value: decoder.decode(bytes.subarray(offset + 2, offset + 2 + len)),
      length: 2 + len
    };
  }

  function packPacket(header, body) {
    var len = encodeVarint(body.length);
    var out = new Uint8Array(1 + len.length + body.length);
    out[0] = header;
    out.set(len, 1);
    out.set(body, 1 + len.length);
    return out;
  }

  function encodeConnect(options) {
    var opts = options || {};
    var keepalive = opts.keepalive == null ? 60 : opts.keepalive;
    var clean = opts.cleanSession === false ? 0x00 : 0x02;
    var variableHeader = concat([
      encodeString('MQTT'),                       // 协议名
      Uint8Array.from([0x04, clean,              // 版本 3.1.1 + 连接标志
                       keepalive >> 8, keepalive & 0xff])
    ]);
    var payload = encodeString(opts.clientId || '');
    return packPacket(0x10, concat([variableHeader, payload]));
  }

  /* QoS 固定 0：PUBLISH 不带 packet id，免掉一整套 PUBACK 匹配/重发逻辑。
   * retained 消息在 QoS 0 订阅下照样全量下发，展示型应用不需要 QoS 1。 */
  function encodeSubscribe(packetId, filters) {
    var parts = [Uint8Array.from([packetId >> 8, packetId & 0xff])];
    for (var i = 0; i < filters.length; i++) {
      parts.push(encodeString(filters[i]));
      parts.push(Uint8Array.from([0x00]));
    }
    return packPacket(0x82, concat(parts));
  }

  function encodePingreq() {
    return Uint8Array.from([0xc0, 0x00]);
  }

  function encodeDisconnect() {
    return Uint8Array.from([0xe0, 0x00]);
  }

  /* 解析一个完整报文（不足一个报文时返回 null）。 */
  function decodePacket(chunk) {
    var bytes = toBytes(chunk);
    if (bytes.length < 2) return null;
    var header = bytes[0];
    var type = header >> 4;
    var flags = header & 0x0f;
    var len = decodeVarint(bytes, 1);
    if (len === null) return null;
    var start = 1 + len.length;
    var end = start + len.value;
    if (bytes.length < end) return null;
    var body = bytes.subarray(start, end);

    if (type === TYPE.CONNACK) {
      if (body.length < 2) return null;
      return { type: type, sessionPresent: (body[0] & 0x01) === 1, returnCode: body[1] };
    }
    if (type === TYPE.PUBLISH) {
      var topic = decodeString(body, 0);
      if (!topic) return null;
      var qos = (flags >> 1) & 0x03;
      var off = topic.length;
      var packetId = null;
      if (qos > 0) {
        if (body.length < off + 2) return null;
        packetId = (body[off] << 8) | body[off + 1];
        off += 2;
      }
      return {
        type: type,
        qos: qos,
        retain: (flags & 0x01) === 1,
        dup: (flags & 0x08) === 1,
        topic: topic.value,
        packetId: packetId,
        payload: decoder.decode(body.subarray(off))
      };
    }
    if (type === TYPE.SUBACK) {
      if (body.length < 2) return null;
      return { type: type, packetId: (body[0] << 8) | body[1] };
    }
    return { type: type, flags: flags, body: body };
  }

  /* 流式拆包：WebSocket 的一条消息可能含多个 MQTT 报文，一条报文也
   * 理论上可能被拆到两条消息里。攒够一个完整报文才吐出来。 */
  function Reader() {
    this.buffer = new Uint8Array(0);
  }

  Reader.prototype.push = function (chunk) {
    var bytes = toBytes(chunk);
    this.buffer = concat([this.buffer, bytes]);
    var packets = [];
    for (;;) {
      if (this.buffer.length < 2) break;
      var len = decodeVarint(this.buffer, 1);
      if (len === null) break;
      var total = 1 + len.length + len.value;
      if (this.buffer.length < total) break;
      packets.push(decodePacket(this.buffer.subarray(0, total)));
      this.buffer = this.buffer.subarray(total);
    }
    return packets;
  };

  var api = {
    TYPE: TYPE,
    toBytes: toBytes,
    concat: concat,
    encodeVarint: encodeVarint,
    decodeVarint: decodeVarint,
    encodeString: encodeString,
    decodeString: decodeString,
    encodeConnect: encodeConnect,
    encodeSubscribe: encodeSubscribe,
    encodePingreq: encodePingreq,
    encodeDisconnect: encodeDisconnect,
    decodePacket: decodePacket,
    Reader: Reader
  };

  root.MQTT311 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
