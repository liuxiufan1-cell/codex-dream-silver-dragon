# 原生 MemoryRouter 与任务状态适配

本适配为实验性宿主模板，需针对兼容客户端验证。应用在 `app://-/index.html` 内切换页面，地址不会随当前线程变化，还会保留历史页面。旧 NGO 控制器遍历已跟踪节点时可把历史首页作为当前路由，其暂停和终止状态也可能属于旧页面。

组件读取公开业务标记，不读取 React 私有状态、消息正文、输入内容、凭据或任务日志。当前 home/thread 锚点须具有可见布局，且不能处于 `data-app-shell-active-page="false"` 下；同时出现无法区分的活动页时降为 other。页面类型或唯一当前线程身份变化会增加独立 epoch 并解除旧绑定。档位和 character/status 开关继续使用 NGO 的偏好；当前页面的可见性、IME、滚动、菜单和切页收敛由组件自身处理。

## 当前线程身份

只有唯一活动的公开侧栏行可提供当前 host 和线程身份：

- `data-app-action-sidebar-thread-active="true"`
- `data-app-action-sidebar-thread-kind="local"`
- `data-app-action-sidebar-thread-host-id`
- `data-app-action-sidebar-thread-id="local:<ID>"`

已持久化 UUID 可直接匹配真实 MCP `params.threadId`。`client-new-thread:<UUID>` 是 UI 别名，不等于真实线程 ID。相关应用实现的 `app-shared-efae91d19fbd.js` 中 ydt（导出 Lct）生成 `thread-client-id-v1:${encodeURIComponent('local:'+真实ID)}`；`app-initial-83973da15da9.js` 中 zXt 在确立映射时发布值为客户端别名的 persisted atom。组件只被动接收 `persisted-atom-updated`／`persisted-atom-sync` 中这一前缀，不查询或读取其他偏好值，也不发送同步请求。

别名映射、冲突记录和候选任务都有固定上限。冲突或映射饱和会关闭别名绑定，canonical 线程不受影响。挂载之前未观察到的别名映射保持未知；冷启动后的 canonical 行或之后观察到的有效映射可正常绑定。

## 真实事件与完成门控

事件来源采用兼容 NGO 的 preload 契约：隔离 preload 的 null source／空 origin，或同窗口、当前 origin；其他窗口和 origin 均拒绝。组件继续要求本地 app 协议及真实 electronBridge 存在。

`turn/started` 的 inProgress 或当前匹配 turn 的真实 streaming delta 可建立 active 绑定。完成、失败和中断只接受同 host、线程、turn 和 epoch 的 `turn/completed` 结构化状态。原生审批请求为静态 attention，只有对应的真实 resolved 事件恢复原 phase。终止已锁定后忽略重复结果、旧 delta 和旧 start。

React 提交新页面可能略晚于真实 start。组件最多暂存八个 start，最长四秒，仅在当前公开身份精确匹配且尚未终止时采用。这个时限只丢弃过期候选，不制造完成；已在绑定前结束的候选不会在打开历史任务时补播成功。

成功亮光必须同时满足：本独立 epoch 内已观察到真实绑定 active、当前仍为该线程、收到同一 turn 的 completed，且当前档位、status 开关和交互静音允许显示。失败、取消、切页、后台、菜单和滚动期间不补播成功。没有可靠绑定时保留 unknown。

## 校验边界

`tests/test-runtime-native.mjs` 使用公开 DOM 和结构化事件的惰性夹具，不启动应用、不连接端口、不读取实际会话。它验证历史首页排除、固定地址下的 epoch、canonical 和别名绑定、冲突、旧 turn／旧 epoch、失败取消、审批、减少动态与清理。当前验证范围见 `docs/native-acceptance.md`；夹具回归不能证明所有环境兼容。
