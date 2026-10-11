# Env Lens

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

检查不同环境中缺失的配置，而不在报告中暴露值。本地 CLI 根据键名契约和最多三个文件生成离线对照报告。

[体验](https://jeffrog-256k1.github.io/env-lens/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![Env Lens](assets/preview.png)

## 本地运行

Node.js 22.12+ · npm

```sh
git clone https://github.com/jeffrog-256k1/env-lens.git
cd env-lens
npm ci
npm run check -- --contract examples/contract.json --env local=examples/local.env.sample --env preview=examples/preview.env.sample --out reports/review
# Static fictional demo:
npm run build
npm run dev
```

示例故意返回**退出码 1**，因为必填值为空或缺失。直接打开 reports/review/index.html；report.json 保存相同的不含值的数据。不指定 --out 时输出 JSON 到标准输出。每次使用新目录，已有目录不会被覆盖。演示地址：http://127.0.0.1:4319。

## 工作方式

在 required 和 optional 中声明键名，指定一到三个 --env 名称=路径。矩阵区分已设置、空值、缺失、重复和无效赋值，可搜索键名或仅显示问题。--lang 支持 en、ko、zh-CN、ja、es，报告内也可切换语言。

退出码 **0**：没有阻塞问题。**1**：必填键为空/缺失、重复或语法错误。**2**：参数、输入、契约或输出错误。契约外的键仅警告；可选键为空或缺失不会阻塞。不会比较、验证、哈希或部分显示值。

```json
{ "version": 1, "required": ["APP_URL", "SESSION_SECRET"], "optional": ["LOG_LEVEL"] }
```

## 范围与限制

仅读取明确指定的 UTF-8 普通文件，每个不超过 64 KiB，契约与输入合计最多 200 个不同键、三个环境。键名用 ASCII 字母、数字和下划线，不能以数字开头；环境标签最多 32 个字母、数字、下划线或连字符。契约只允许 version、required、optional。

支持 KEY=value、export 前缀、空行、# 注释、**单行**单双引号及尾部注释。引号内的 # 为字面字符。双引号中处理反斜杠转义，转义 n/r/t 和纯空白视为空。不会插值或执行命令。重复键始终阻塞。未闭合引号或多行值会报错并**停止解析后续行**。这不是完整的 dotenv 或框架加载器。

键名、环境标签和行号会保留，分享前请审查。示例均为虚构。不提供上传服务、云同步、值相等比较或密钥存储。

## 开发

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)
