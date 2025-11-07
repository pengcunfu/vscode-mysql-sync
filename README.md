# MySQL Sync

![Build VSIX](https://github.com/YOUR_USERNAME/vscode-mysql-sync/workflows/Build%20VSIX/badge.svg)

一个用于同步本地 MySQL 数据库到远程服务器的 VSCode 插件。

## 功能特性

- 🚀 一键同步本地数据库到远程服务器
- 📋 自动同步表结构和数据
- 🔄 批量数据传输，提高效率
- 📊 实时进度显示
- ⚙️ 简单的 JSON 配置文件

## 安装

1. 在 VSCode 扩展市场搜索 "MySQL Sync"
2. 点击安装
3. 重启 VSCode

## 使用方法

### 1. 配置数据库连接

在项目根目录创建 `.mysql-sync.json` 配置文件：

```json
{
  "local": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "本地密码",
    "database": "本地数据库名"
  },
  "remote": {
    "host": "服务器IP",
    "port": 3306,
    "user": "root",
    "password": "宝塔数据库密码",
    "database": "服务器数据库名"
  }
}
```

**注意**: 
- `.mysql-sync.json` 已添加到 `.gitignore`，不会被提交到版本控制
- 首次运行命令时，如果配置文件不存在，会自动创建模板文件

### 2. 执行同步

有两种方式触发同步：

**方式一：命令面板**
1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (Mac) 打开命令面板
2. 输入 `MySQL Sync: 同步数据库到远程服务器`
3. 按 Enter 执行

**方式二：右键菜单**
- 在文件浏览器中右键，选择 "MySQL Sync: 同步数据库到远程服务器"

### 3. 查看同步进度

同步过程中会显示进度通知，包括：
- 读取配置文件
- 连接数据库
- 同步各个表的进度
- 完成状态

## 配置说明

### 配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `local.host` | 本地数据库主机地址 | localhost |
| `local.port` | 本地数据库端口 | 3306 |
| `local.user` | 本地数据库用户名 | root |
| `local.password` | 本地数据库密码 | - |
| `local.database` | 本地数据库名称 | - |
| `remote.host` | 远程数据库主机地址 | - |
| `remote.port` | 远程数据库端口 | 3306 |
| `remote.user` | 远程数据库用户名 | root |
| `remote.password` | 远程数据库密码 | - |
| `remote.database` | 远程数据库名称 | - |

### VSCode 设置

可以在 VSCode 设置中修改配置文件路径：

```json
{
  "mysql-sync.configPath": ".mysql-sync.json"
}
```

## 注意事项

⚠️ **重要提醒**：

1. **数据覆盖**: 同步会完全覆盖远程数据库的表结构和数据，请谨慎操作
2. **数据备份**: 建议在同步前备份远程数据库
3. **网络连接**: 确保能够访问远程数据库服务器
4. **权限要求**: 数据库用户需要有创建、删除表和插入数据的权限
5. **安全性**: 不要将配置文件提交到版本控制系统

## 同步流程

1. 读取配置文件
2. 连接本地和远程数据库
3. 获取本地数据库所有表
4. 逐个表进行同步：
   - 获取表结构 (CREATE TABLE 语句)
   - 在远程删除同名表（如果存在）
   - 在远程创建新表
   - 复制表数据（分批进行，每批 100 条）
5. 关闭数据库连接

## 开发

### 本地开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听文件变化
npm run watch
```

### 调试

1. 在 VSCode 中打开项目
2. 按 F5 启动调试
3. 在新窗口中测试插件

### 打包

```bash
# 安装 vsce
npm install -g @vscode/vsce

# 打包
vsce package
```

## 依赖

- [mysql2](https://github.com/sidorares/node-mysql2) - MySQL 客户端

## 许可

MIT

## 更新日志

### 0.0.1

- 初始版本
- 支持基本的数据库同步功能
- 支持自动创建配置文件模板

## 反馈

如有问题或建议，请提交 Issue。

