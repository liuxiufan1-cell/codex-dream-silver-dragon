# 素材与配色

主题：白银龙娘 · 紫晶白昼。主色白，辅助色淡紫，正文为深灰紫；状态使用可分辨的文字与颜色。

- `palette.json`：共享配色。构建生成预览变量和静态主题，动态组件内嵌同一变量表。
- `assets/layers/seated-source.png`：新生成的成年白银龙娘坐姿透明原图，保留长发、龙角、龙翼、尾巴与银结特征。
- 八层人物为同一原图的互补遮罩分区，共享 1024×1536 画布。`npm run generate:layers` 可再导出，之后需检查眼睑位置。
- `assets/art/moon-palace-background.png`：新生成的白色晶宫场景，不含人物。动态组件不使用烘焙人物的静态背景。
- `assets/ui/dragon-portrait-medallion.svg`：从新坐姿人物派生的头像。其余龙纹与银结装饰继续沿用。
- `concepts/`：浏览器运行模拟预览的截图，非实际客户端截图。

静态背景由同一浏览器场景导出，作为备用；不能代替动态安装。生成图与派生素材的权利说明见 [权利声明](../LICENSE-NOTICE.md)。
