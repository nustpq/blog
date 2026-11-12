# 状态监控

NanoPi / Odroid N2 / T440 的实时状态看板。数据来自公共 broker
`broker.emqx.io` 的 retain 消息，页面打开第一秒就有完整快照。

<div class="mqtt-frame-wrap">
  <iframe src="mqttweb/index.html" class="mqtt-frame" title="设备状态看板"
          loading="lazy" referrerpolicy="no-referrer"></iframe>
</div>

<p style="font-size:13px;opacity:.7;margin-top:8px">
  面板没有加载出来？<a href="mqttweb/index.html" target="_blank">在新标签页打开</a>。
</p>

## 用法

| 输入 | 说明 |
|---|---|
| Broker | 默认 `wss://broker.emqx.io:8084/mqtt`。必须 **wss**，浏览器不允许网页发裸 TCP |
| MQTT 路径 | 填到命名空间即可：`nustpq/nanopi`、`nustpq/n2`（Odroid N2）、`nustpq/t440` |

添加后自动订阅 `<路径>/stat/#`。配置存在浏览器 `localStorage`，下次打开自动连。

## 注意

- 这是 docsify 里的 **iframe 嵌入**，不是文档正文。看板是独立的 HTML 应用，
  有自己的 CSS 和脚本——如果把 `index.html` 直接当文档路径打开（`/#/mqttweb/index.html`），
  docsify 会把它当 Markdown 读，只剩文字。
- `broker.emqx.io` 是匿名公开 broker，`nustpq/` 下任何人都能读。只放指标，
  不要放凭据或隐私数据。
- 看板源码在 NanoHatOLED 仓库的 `tools/nanopi/web/`，改动后把整个目录
  同步到这个 `mqttweb/` 下即可。
