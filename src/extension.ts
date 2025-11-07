import * as vscode from 'vscode';
import { syncDatabase } from './sync';
import { loadConfig, generateConfigFile } from './config';

export function activate(context: vscode.ExtensionContext) {
    console.log('MySQL Sync 插件已激活');

    // 注册同步数据库命令
    let syncDisposable = vscode.commands.registerCommand('mysql-sync.syncDatabase', async () => {
        try {
            // 显示进度条
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "MySQL 数据库同步",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "正在读取配置文件..." });

                // 加载配置
                const config = await loadConfig();
                if (!config) {
                    vscode.window.showErrorMessage('无法加载配置文件，请确保 .vscode/.mysql-sync.json 存在');
                    return;
                }

                progress.report({ increment: 20, message: "正在连接数据库..." });

                // 执行同步
                await syncDatabase(config, progress);

                progress.report({ increment: 100, message: "同步完成!" });
            });

            vscode.window.showInformationMessage('数据库同步成功！');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`数据库同步失败: ${errorMessage}`);
            console.error('同步错误:', error);
        }
    });

    // 注册生成配置文件命令
    let generateConfigDisposable = vscode.commands.registerCommand('mysql-sync.generateConfig', async () => {
        await generateConfigFile();
    });

    context.subscriptions.push(syncDisposable, generateConfigDisposable);
}

export function deactivate() {
    console.log('MySQL Sync 插件已停用');
}

