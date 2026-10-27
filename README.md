# 白银龙娘 · 紫晶白昼（动态测试版）

**Codex Dream Silver Dragon · v1.0.0-beta.2**

白色为主、紫色点缀的 Codex 动态皮肤：右侧斜坐龙娘、白色晶宫、左侧海报式操作区，首页与聊天页统一浅色阅读面板。

![首页浏览器预览](concepts/home-2560x1440.png)
![聊天页浏览器预览](concepts/chat-2560x1440.png)

以上为独立模拟预览的 Chromium 截图，不是实际 Codex 截图；消息和任务状态均为示例。

## 动态皮肤与安装

**主要交付为动态组件与版本锁定接入工具。仅导入静态 ZIP 不会安装动态人物。**

1. 使用 Windows NGO **v1.9.0**；接入工具会校验官方 injector 的精确哈希，未知版本停止安装。
2. 在引擎中导入配套的 `static` ZIP 并选择本主题。
3. 退出 Codex 和主题工具，按[安装说明](docs/installation.md)运行动态接入工具。
4. 重启主题工具与 Codex，启用人物动效；默认建议「轻量」，也支持关闭和完整。

这是测试版。已经验证浏览器渲染、组件逻辑和固定版本引擎的组装流程；**尚未在 Windows Codex 客户端验收**，不承诺未测试的客户端版本兼容。仓库不包含 Codex 或第三方引擎安装器。

## 动态与功能

- 新坐姿人物，八层透明图像共享同一坐标画布，头脸与手脚保持稳定。
- 独立躯干轻呼吸、发梢和袖摆微动、翼尾摆动及三态眨眼。
- 关闭 / 轻量 / 完整三档，尊重宿主开关与系统减少动态设置。
- 菜单、输入法组合、滚动和后台期间暂停或收敛动态；清理和重复挂载可恢复。
- 宽屏人物位于右侧；窄窗口隐藏人物；聊天页减少装饰，保持正文、代码与输入框稳定。
- 装饰不接收鼠标或键盘事件；真实任务绑定保留原有结构化事件校验，不从聊天文字推测状态。
- `palette.json` 为配色来源，预览、动态组件和静态主题从同一份配色生成。

## 预览、测试与打包

Node.js 20+。普通预览、构建、逻辑测试和打包只需 Node 内置模块；素材再导出和浏览器验证需要开发依赖。

```sh
npm run preview
npm run build
npm test
npm run package
```

Windows 可双击 `launch-preview.cmd`。预览只监听本机回环地址，不连接真实会话。

```sh
npm ci
npx playwright install chromium
npm run test:browser
npm run render:concepts
```

系统已安装 Chromium 时可设置 `CHROMIUM_PATH`。固定版本引擎验证使用 `NGO_ENGINE_DIR` 指向官方 v1.9.0 的 `windows` 目录，再运行 `npm run test:engine`；该检查只修改临时副本。

包输出至 `release/v1.0.0-beta.2/`：Windows 动态主题包含构建组件、接入/恢复工具与预览；静态备用包严格只有三个文件；源码包包含编辑源文件和验证脚本。每个包附 SHA256 清单。

## 项目说明

- [本次验证记录](docs/validation-beta2.md)
- [安装与恢复](docs/installation.md)
- [副本与安装差异、验证边界](docs/native-acceptance.md)
- [动态组件与界面设计](docs/runtime-design.md)
- [素材与配色](docs/assets.md)
- [动作规范](docs/motion-spec.md)
- [真实路由与任务绑定](docs/runtime-memory-router.md)
- [第三方关系](docs/third-party.md)

公开内容供查看和下载，未额外授予修改、再分发或商业使用许可，见 [权利声明](LICENSE-NOTICE.md)。本项目与 OpenAI 无隶属或官方背书关系。
