## v1.4.0

- 🐛 fix: No longer call `saveData` inside `onunload`

## v1.3.0

- ✨ feat: 支持使用 @type/ 下的 @slash 命令

## v1.2.0

- 🐛 fix [#7](https://github.com/frostime/sy-quick-attr/issues/7)
  - 去掉了基于 clearCb 的方案
  - 改成基于 setTimeout 的方案，使用宏任务来解决问题

## v1.0.1

🐛 修复忘了判断 clearCb 是否存在就调用导致的错误。

## v1.0.0

支持了 `@value/input` 功能。

### v0.8.0

优化了 textarea 缩进、反缩进等功能。

### v0.7.0

支持通过定义 `@slash` 命令在编辑器中输入 `/attr` 快速添加属性。[#4](https://github.com/frostime/sy-quick-attr/issues/4)

### v0.4.0

支持块类型过滤：[#1](https://github.com/frostime/sy-quick-attr/issues/1)
