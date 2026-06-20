# Assets Folder

放置游戏素材文件的目录。所有素材不写死在代码中，通过 JSON 配置引用。

## 目录结构建议：
- textures/   - 图片纹理（票样、证件、背景等）
- audio/      - 音效和背景音乐
- fonts/      - 自定义字体

## 添加新素材步骤：
1. 将素材文件放入对应子目录
2. 在 data/ 目录下的 JSON 配置中引用路径（如 "icon": "res://assets/textures/ticket_normal.png"）
3. 在脚本中通过 preload() 或 load() 动态加载
