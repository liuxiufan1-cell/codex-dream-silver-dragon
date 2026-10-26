# 测试版使用与兼容性

当前版本：**v1.0.0-beta.1（公开测试版）**。兼容性仍在验证，不承诺所有客户端版本或平台均能使用。

## 独立模拟预览

1. 解压源码包或 Windows 主题包。
2. 安装 Node.js 20+，确保 `node` 可通过命令行调用。
3. 执行 `npm run preview`；Windows 也可双击 `launch-preview.cmd` 或软件包内的 `启动测试预览.cmd`。
4. 打开终端显示的浏览器地址。关闭终端可停止预览。

预览中的消息、任务状态和交互均为演示，不连接实际会话或调用模型。动态档位可在预览内切换。

## 普通静态主题

通过兼容 Dream Skin / NGO 引擎的主题导入功能选择 static ZIP。ZIP 根目录严格只有 `theme.json`、`theme.css`、`background.png`；它没有脚本、分层动态或真实任务绑定。

不同引擎版本可能有不同校验规则。此包按简化主题包结构提供，导入前应查阅所用引擎文档。

## 实验性动态组件

`npm run build` 生成 `runtime/dist/moon-palace.bundle.js` 和 `runtime/dist/manifest.json`；Windows 主题包已附构建产物。所有素材内嵌于组件，宿主应先验证清单与哈希再挂载。

`integration/host-payload.mjs` 和 `integration/patch-engine.mjs` 是开发者集成模板，不会自动寻找、安装或启动任何应用。模板中的哈希占位符必须由经过核验的构建清单提供；集成者还需验证宿主代码、事件契约、挂载和清理顺序。

**测试版暂不提供通用客户端安装器。** 动态组件需要兼容宿主；不能通过把脚本放进普通主题 ZIP 来安装。使用第三方引擎时请遵守其许可，并自行保留必要恢复方案。
