# 白银龙娘 · 月夜晶宫：动态组件（测试版）

此实验性组件面向兼容宿主的 Codex renderer 接入；它不载入独立模拟预览，不替换聊天、输入框、项目或按钮，不调用模型。普通主题 ZIP 仍仅包含静态背景、配置和受限 CSS。

## 构建与宿主契约

运行 `node scripts/build-runtime.mjs` 生成 `runtime/dist/moon-palace.bundle.js` 与 `runtime/dist/manifest.json`。后者记录固定主题 ID、版本、每项源素材 SHA256 和 bundle SHA256。所有图像内嵌 Data URL，无需本机网页服务器或网络请求；固定白名单禁止加载其他脚本或外链 SVG。宿主必须验证清单并且只为 `silver-dragon-moon-palace` 执行此可信组件，不能接受普通主题 ZIP 中的脚本。

执行 bundle 后可调用 `window.__SILVER_DRAGON_MOON_PALACE__.inspect()` 查看动态模式、真实路由、任务绑定、图层加载、眨眼次数和清理资源计数。`cleanup()` 移除自有 scene/style/属性、事件、定时器与观察器，重复调用安全。重复注入先清理旧实例。宿主还应在 renderer 原有 cleanup 前主动调用它。

## 素材和动作

纯宫殿背景和 V4 左侧龙翼/鳞尾彩雾分别叠加，避免使用已经烘焙人物的 `static-theme/background.png` 导致人物重影。人物使用原清单 1024×1536 坐标的八层图像，正常眼睛保留在固定 core，半闭/闭眼使用共用 SVG。core 不运动；呼吸仅在独立羽化躯干遮罩层上以六秒微缩放。发梢与袖摆采用清单七至九秒周期，双翼和尾巴约十一秒，眨眼间隔五至八秒。首页全身，thread 页半身；窄窗口降低对比度，正文、代码和输入区有稳定暗底。

Home 的原生标题与输入框收进左侧列，现有四个入口采用两列布局、细银边和统一淡紫图标。首页人物最大约 85vh，保持右边和下边留白；thread 正文与代码的几何布局不受此首页调整影响。仅隐藏 NGO 自带的浮动天使、直播伪标签与像素心徽等装饰。组件使用原生应用已有的 `properties` CSS 层，让自有主题范围内的重要样式优先于 NGO community 层；直接添加未分层的 `!important` 无法覆盖后者。native 建议与 fallback 建议继续由引擎选择，组件不会把两组同时强制显示。

## 实际状态与降级

档位及效果开关读取兼容引擎 `theme-motion.js` 的 `window.__CODEX_DREAM_SKIN_MOTION_STATE__.inspect()` 和根属性，没有假设不存在的订阅接口。新版客户端的 MemoryRouter 地址固定为 `index.html`，还会保留历史页面；因此真实页面由当前可见的公开 home/thread 锚点识别，排除 `data-app-shell-active-page="false"`，并维护独立的路由 epoch。历史页面导致的 host.route、host.paused 和旧任务结果不作为当前页面依据。

当前线程由唯一活动侧栏行的公开 host/ID 标记确认。真实任务只接收同一窗口／隔离 preload 的结构化 MCP 事件，严格匹配 host、线程、turn 和当前独立 epoch；不会读取消息正文、扫描聊天文本，或用停止按钮消失推断完成。`client-new-thread:` 是客户端别名，只有被动观察到应用自己的 `thread-client-id-v1:` 映射后才可绑定；未知、冲突或挂载前未确认的别名保持未知。详见 `runtime-memory-router.md`。

busy/streaming 时光环二十四秒匀速转动；needs-attention/failed 为静态颜色提示。只有已观察到当前真实绑定任务的 active→completed 才短亮一次，换页、重复终止、失败和过期事件不产生成功亮光。若结果出现在菜单、滚动或后台期间，短亮直接舍弃，避免恢复页面时补播过期反馈。

动态档位采用引擎实际 off/subtle/full（system 经引擎映射），并遵守 character/status 开关。关闭与系统减少动态停止动画；菜单、输入法组合、滚动、路由切换和隐藏页面暂停或收敛。所有装饰都为 inert/aria-hidden/pointer-events:none，不截获点击或键盘焦点。

## 验证范围

`node tests/test-runtime-state.mjs` 验证眨眼取消、档位、降级和清理；`node tests/test-runtime-native.mjs` 用惰性公开 DOM、虚拟时钟和结构化 preload 事件验证保留页、固定 URL、线程身份、别名映射、路由 epoch、过期事件和原生完成门控。它们不连接应用或网络，不能代替跨版本、跨平台和实际界面验收。测试版不提供通用安装器；公开包不含特定设备部署配置。
