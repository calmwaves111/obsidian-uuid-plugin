# Obsidian uuid Plugin

这是 [Obsidian](https://obsidian.md) 的一个插件，用来给笔记添加uuid。
改自 [llimllib/obsidian-guid-plugin](https://github.com/llimllib/obsidian-guid-plugin)，添加了一些配置项。

现在有两个命令：
1. Add an ID to all notes：给所有笔记添加uuid。
2. Add an ID to current note：给当前打开的笔记添加uuid。

在设置界面可以配置uuid的key值。

- [x] 去掉在笔记修改时自动添加uuid的功能
- [x] 增加设置界面，配置uuid的key值
- [x] 增加命令 Add an ID to current note，强制给当前文件添加uuid，不考虑是否在黑名单内
- [ ] Add an ID to current note只针对md笔记，排除掉当前打开的是其他格式文件
- [ ] 增加命令 Add an Id to whitelist，按文件路径添加
- [ ] 增加命令 Add an Id besides blacklist，按文件路径忽略
- [ ] 白名单和黑名单支持正则表达式
- [ ] 切换uuid生成算法：按创建时间戳生成
- [ ] whitelist和blacklist按其他条件筛选，如标签等

## How to use

打开命令面板，搜索uuid，运行所需命令

## Manually installing the plugin

复制`main.js`, `styles.css`, `manifest.json` 到库目录下 `VaultFolder/.obsidian/plugins/obsidian-uuid-plugin/`.
