import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DatabaseConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

export interface MySQLSyncConfig {
    local: DatabaseConfig;
    remote: DatabaseConfig;
}

export async function loadConfig(): Promise<MySQLSyncConfig | null> {
    try {
        // 获取配置文件路径
        const config = vscode.workspace.getConfiguration('mysql-sync');
        const configFileName = config.get<string>('configPath', '.vscode/.mysql-sync.json');

        // 获取工作区根目录
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return null;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const configPath = path.join(workspaceRoot, configFileName);
        
        // 确保 .vscode 目录存在
        const vscodeDir = path.dirname(configPath);
        try {
            await fs.access(vscodeDir);
        } catch (error) {
            await fs.mkdir(vscodeDir, { recursive: true });
        }

        // 检查配置文件是否存在
        try {
            await fs.access(configPath);
        } catch (error) {
            // 配置文件不存在，创建示例配置
            const exampleConfig: MySQLSyncConfig = {
                local: {
                    host: "localhost",
                    port: 3306,
                    user: "root",
                    password: "本地密码",
                    database: "本地数据库名"
                },
                remote: {
                    host: "服务器IP",
                    port: 3306,
                    user: "root",
                    password: "宝塔数据库密码",
                    database: "服务器数据库名"
                }
            };

            await fs.writeFile(configPath, JSON.stringify(exampleConfig, null, 2), 'utf-8');
            
            // 打开配置文件供用户编辑
            const doc = await vscode.workspace.openTextDocument(configPath);
            await vscode.window.showTextDocument(doc);
            
            vscode.window.showWarningMessage('已创建配置文件模板，请先配置数据库信息后再同步');
            return null;
        }

        // 读取并解析配置文件
        const configContent = await fs.readFile(configPath, 'utf-8');
        const mysqlConfig: MySQLSyncConfig = JSON.parse(configContent);

        // 验证配置
        if (!validateConfig(mysqlConfig)) {
            vscode.window.showErrorMessage('配置文件格式不正确，请检查');
            return null;
        }

        return mysqlConfig;
    } catch (error) {
        console.error('加载配置文件失败:', error);
        vscode.window.showErrorMessage('加载配置文件失败: ' + (error instanceof Error ? error.message : String(error)));
        return null;
    }
}

function validateConfig(config: any): config is MySQLSyncConfig {
    if (!config || typeof config !== 'object') {
        return false;
    }

    const validateDbConfig = (db: any): db is DatabaseConfig => {
        return db &&
            typeof db.host === 'string' &&
            typeof db.port === 'number' &&
            typeof db.user === 'string' &&
            typeof db.password === 'string' &&
            typeof db.database === 'string';
    };

    return validateDbConfig(config.local) && validateDbConfig(config.remote);
}

export async function generateConfigFile(): Promise<void> {
    try {
        // 获取工作区根目录
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        const config = vscode.workspace.getConfiguration('mysql-sync');
        const configFileName = config.get<string>('configPath', '.vscode/.mysql-sync.json');
        const configPath = path.join(workspaceRoot, configFileName);

        // 检查并创建 .vscode 目录
        const vscodeDir = path.dirname(configPath);
        try {
            await fs.access(vscodeDir);
        } catch (error) {
            // .vscode 目录不存在，创建它
            await fs.mkdir(vscodeDir, { recursive: true });
            console.log('.vscode 目录已创建');
        }

        // 检查配置文件是否已存在
        try {
            await fs.access(configPath);
            const overwrite = await vscode.window.showWarningMessage(
                `配置文件 ${configFileName} 已存在，是否覆盖？`,
                '是',
                '否'
            );
            
            if (overwrite !== '是') {
                vscode.window.showInformationMessage('已取消生成配置文件');
                return;
            }
        } catch (error) {
            // 文件不存在，继续创建
        }

        // 创建配置文件模板
        const exampleConfig: MySQLSyncConfig = {
            local: {
                host: "localhost",
                port: 3306,
                user: "root",
                password: "本地密码",
                database: "本地数据库名"
            },
            remote: {
                host: "服务器IP",
                port: 3306,
                user: "root",
                password: "宝塔数据库密码",
                database: "服务器数据库名"
            }
        };

        await fs.writeFile(configPath, JSON.stringify(exampleConfig, null, 2), 'utf-8');
        
        // 打开配置文件供用户编辑
        const doc = await vscode.workspace.openTextDocument(configPath);
        await vscode.window.showTextDocument(doc);
        
        vscode.window.showInformationMessage(`配置文件 ${configFileName} 已生成，请根据实际情况修改配置`);
    } catch (error) {
        console.error('生成配置文件失败:', error);
        vscode.window.showErrorMessage('生成配置文件失败: ' + (error instanceof Error ? error.message : String(error)));
    }
}

