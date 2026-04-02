# 视频创建时间计算器 — 版本管理指南

## 目录结构

```
video-time-extension/   ← 扩展源码目录（你维护这个）
  manifest.json
  content.js
  popup.html
  pack.py               ← 一键打包脚本
  icon16/48/128.png

server-files/           ← 上传到服务器的文件
  video-time-extension.crx
  update.xml
```

---

## 首次发布流程

### 第一步：安装扩展，获取扩展 ID

1. 打开 `chrome://extensions`，开启"开发者模式"
2. 点击"加载已解压的扩展程序"，选择 `video-time-extension/` 目录
3. 记录页面上显示的扩展 ID（32位字母串，例如：`abcdefghijklmnopabcdefghijklmnop`）

### 第二步：运行打包脚本

```bash
cd video-time-extension
python pack.py 1.1.0
# 按提示输入：扩展 ID、服务器 URL
```

### 第三步：上传到服务器

将 `server-files/` 下两个文件上传到你的静态文件服务器：

```
https://YOUR_SERVER/video-time-ext/video-time-extension.crx
https://YOUR_SERVER/video-time-ext/update.xml
```

**服务器要求：**
- 任意静态文件托管均可（Nginx、GitHub Pages、内网文件服务器）
- `.crx` 文件的 Content-Type 需为 `application/x-chrome-extension`（Nginx 默认支持）
- 需要 HTTPS

### 第四步：分发给同事

把 `server-files/video-time-extension.crx` 发给同事，他们：
1. 直接把 `.crx` 文件拖入 `chrome://extensions` 页面即可安装
2. **无需解压，无需开发者模式**

---

## 后续更新流程（你只需要做这三步）

```
1. 修改 content.js（改逻辑）
2. python pack.py 1.2.0   ← 改版本号
3. 上传新的 crx + update.xml 到服务器
```

同事浏览器会在 **1～5 小时内自动静默更新**，无需任何操作。

---

## 服务器 Nginx 配置参考（如需）

```nginx
location /video-time-ext/ {
    root /var/www/;
    add_header Access-Control-Allow-Origin *;
    types {
        application/x-chrome-extension crx;
        text/xml                        xml;
    }
}
```

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 同事安装后提示"无法从该网站添加应用" | Chrome 政策限制非商店安装 | 见下方 Edge 方案 |
| 更新不生效 | 浏览器缓存 | `chrome://extensions` 点击"更新" |
| update.xml 404 | 路径填写有误 | 检查 manifest.json 中 update_url |

### 如果公司统一用 Edge

Edge 支持通过**组策略**推送扩展，无需任何手动操作即可强制安装并自动更新。
联系 IT 部门配置 `ExtensionInstallForcelist` 策略即可。
