# Just-DDL Mini Program

Just-DDL 微信小程序版，消费 Just-DDL Hub 导出的统一数据出口，而不是在小程序端重新抓取数据。

## 架构

- 子专题仓库：负责 crawler、validator、link-check、Pages。
- `Just-Agent/just-ddl` Hub：汇总所有专题并导出 `/miniprogram/*.json`。
- 本仓库：微信原生小程序，负责移动端浏览、收藏、倒计时和缓存。

## 功能

- 主题广场：浏览 21 个专题，收藏专题，复制来源仓库。
- 我的DDL：汇总收藏专题与收藏事件，支持按专题、时间、名称组织。
- 专题详情：子专题折叠与 Pin，长卡/多卡、Vivid/Simple 切换。
- 事件详情：倒计时、来源、标签、地点、日期、复制官方链接。
- 日历：7/30/90 天近期截止日。
- 设置：中文默认、英文界面切换、缓存刷新、隐私说明。

## 导入微信开发者工具

1. 打开微信开发者工具。
2. 导入本目录。
3. 将 `project.config.json` 中的 `appid` 替换为正式 AppID，或使用本机 `project.private.config.json` 覆盖。
4. 开发阶段可关闭“不校验合法域名”；提审前必须配置 `request` 与图片合法域名。
5. 生产环境建议把 Hub 导出的 JSON 和 `assets/source-previews` 同步到 COS 或 CloudBase 静态托管域名。

## 数据接口

默认读取：

- `https://just-agent.github.io/just-ddl/miniprogram/manifest.json`
- `https://just-agent.github.io/just-ddl/miniprogram/topics.json`
- `https://just-agent.github.io/just-ddl/miniprogram/topics/{topicId}.json`
- `https://just-agent.github.io/just-ddl/miniprogram/search-index.json`

如需切换到腾讯云域名，修改 `miniprogram/utils/config.js` 的 `baseUrl` 和 `assetBaseUrl`。

## CI

GitHub Actions 使用 `miniprogram-ci`，需要配置：

- `WX_APPID`
- `WX_UPLOAD_PRIVATE_KEY`
- `WX_CLOUD_ENV`
- `ROBOT`

## 检查

```bash
npm run check:audit
npm run check:packages
```

上传体验版前安装微信官方上传工具：

```bash
npm install --no-save miniprogram-ci@1.8.18
npm run ci:preview
```

首版不强制登录、不请求手机号/头像/位置。云端收藏同步和订阅提醒已预留云函数接口，放在二期启用。
