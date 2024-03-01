# Obsidian uuid Plugin

这是 [Obsidian](https://obsidian.md) 的一个插件，用来给笔记添加uuid。
改自 [llimllib/obsidian-guid-plugin](https://github.com/llimllib/obsidian-guid-plugin)，添加了一些配置项。

现在有三个命令：
1. Add an UUID to all notes：给所有笔记添加uuid，忽略黑名单。
2. Add an UUID to current note：强制给当前文件添加uuid，不考虑是否在黑名单内。
3. Add an UUID to whitelist note：只给白名单里的文件添加uuid

设置项可配置：
1. uuid的key值
2. uuid的长度
3. uuid的黑名单和白名单
3. uuid的生成算法
4. 如果uuidStyle为创建时间戳，可自定义时间戳的格式，格式参考 [moment.js](https://momentjs.com/docs/#/displaying/format/)

- [x] 去掉在笔记修改时自动添加uuid的功能
- [x] 增加设置界面，配置uuid的key值
- [x] 增加命令 Add an UUID to current note，强制给当前文件添加uuid，不考虑是否在黑名单内
- [x] Add an UUID to current note只针对md笔记，排除掉当前打开的是其他格式文件
- [x] 通知提醒已经存在uuid的笔记
- [x] 增加命令 Add an UUID to whitelist，按文件路径添加
- [x] Add an UUID to all notes besides blacklist，按文件路径忽略
- [ ] 白名单和黑名单支持正则表达式
- [ ] 白名单和黑名单按其他条件筛选，如标签等
- [x] 切换uuid生成算法：按创建时间戳生成
- [ ] 增加文件修改log日志
- [x] 改用[short-unique-id](https://www.npmjs.com/package/short-unique-id)生成算法，可自定义uuid的长度，默认为10
- [x] 创建时间戳支持自定义格式，格式参考 [moment.js](https://momentjs.com/docs/#/displaying/format/)
## How to use

打开命令面板，搜索uuid，运行所需命令

## Manually installing the plugin

复制`main.js`, `styles.css`, `manifest.json` 到库目录下 `VaultFolder/.obsidian/plugins/obsidian-uuid-plugin/`.
