# 动态皮肤安装与恢复

版本：**1.0.0-beta.2**。主要交付为分层动态皮肤，静态 ZIP 是配套主题与备用方案。

## 支持基线

接入工具仅接受 `EmiyaKatuz/Codex-Dream-Skin-Needy-Girl-Overdose` Windows **v1.9.0**，提交 `46d24a75de5781e99ada0ea880887ce62c870e12`。具体 injector 哈希见 `integration/compatible-host.json`。这是本次查询到的最新稳定发布；不随未来版本自动放宽校验。

本次没有可启动的 Windows Codex 客户端，客户端版本与真机兼容性仍待验证。不要把浏览器预览当作真实安装验收。

## 安装动态组件

准备 Node.js 20+，解压 Windows 动态主题包。若使用源码包，先运行 `npm run build`。

1. 安装并启动过 Codex 与 NGO v1.9.0。
2. 通过 NGO 的主题管理导入同版本 `static` ZIP，选择「白银龙娘 · 紫晶白昼」。普通主题导入只安装颜色、CSS 与静态背景。
3. 退出 Codex 和主题工具。找到实际使用的 NGO `windows` 根目录，其中应有 `scripts/injector.mjs` 与 `assets/`。
4. 在主题包根目录运行以下命令，将 `<NGO-windows目录>` 替换成实际目录：

```sh
node integration/install-dynamic.mjs --check "<NGO-windows目录>"
node integration/install-dynamic.mjs --install "<NGO-windows目录>"
```

工具核验原 injector、构建清单与组件哈希，保存原 injector 备份，写入自有伴随文件，最后接入注入流程。只修改显式指定的引擎目录，不修改 Codex 二进制。重复安装同一构建不会重复打补丁；换版本前先恢复。

5. 重启主题工具与 Codex。启用「人物」动效并选择轻量或完整；关闭档与系统减少动态会停止动画。可以先运行引擎自己的 `--check-payload` 核验组装，但该命令不会启动客户端。

动态组件启用时会移除静态背景中的人物绘制，使用纯场景与独立人物图层，避免人物重影。

## 恢复

退出 Codex 和主题工具，然后在同一包目录运行：

```sh
node integration/install-dynamic.mjs --restore "<NGO-windows目录>"
```

恢复工具核验备份与自有文件，恢复原 injector 并移除伴随文件。随后通过引擎菜单选择以前的主题。若引擎文件被其他工具修改，接入/恢复会停止，避免覆盖未知修改；此时可用引擎官方安装器修复。

## 独立预览

运行 `npm run preview`，或双击 `launch-preview.cmd`；Windows 包也提供 `启动测试预览.cmd`。预览只用于构图、动画和交互演示，不连接 Codex，不安装动态组件。

## 静态备用包

ZIP 根目录严格只有 `theme.json`、`theme.css`、`background.png`。它使用相同白紫色表与坐姿背景，但没有分层动作、眨眼或真实任务反馈。三种入口的能力不同，不能以模拟预览截图证明安装成功。
