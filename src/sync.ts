import * as vscode from 'vscode';
import * as mysql from 'mysql2/promise';
import { MySQLSyncConfig, DatabaseConfig } from './config';

interface TableInfo {
    tableName: string;
    createStatement: string;
}

export async function syncDatabase(config: MySQLSyncConfig, progress: vscode.Progress<{ message?: string; increment?: number }>) {
    let localConnection: mysql.Connection | null = null;
    let remoteConnection: mysql.Connection | null = null;

    try {
        // 连接本地数据库
        progress.report({ message: "连接本地数据库..." });
        localConnection = await connectToDatabase(config.local);
        
        // 连接远程数据库
        progress.report({ message: "连接远程数据库..." });
        remoteConnection = await connectToDatabase(config.remote);

        // 获取本地数据库所有表
        progress.report({ increment: 10, message: "获取本地数据库表列表..." });
        const tables = await getTables(localConnection);
        
        if (tables.length === 0) {
            vscode.window.showWarningMessage('本地数据库没有表需要同步');
            return;
        }

        const totalTables = tables.length;
        const incrementPerTable = 50 / totalTables;

        // 同步每个表
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            progress.report({ 
                increment: incrementPerTable, 
                message: `正在同步表 ${i + 1}/${totalTables}: ${table}...` 
            });

            // 获取表结构
            const createStatement = await getTableCreateStatement(localConnection, table);
            
            // 在远程数据库创建或更新表结构
            await syncTableStructure(remoteConnection, table, createStatement);
            
            // 同步表数据
            await syncTableData(localConnection, remoteConnection, table);
        }

        progress.report({ increment: 20, message: "清理和优化..." });

    } catch (error) {
        console.error('数据库同步错误:', error);
        throw error;
    } finally {
        // 关闭连接
        if (localConnection) {
            await localConnection.end();
        }
        if (remoteConnection) {
            await remoteConnection.end();
        }
    }
}

async function connectToDatabase(config: DatabaseConfig): Promise<mysql.Connection> {
    try {
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            multipleStatements: true
        });
        return connection;
    } catch (error) {
        throw new Error(`连接数据库失败 (${config.host}:${config.port}): ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function getTables(connection: mysql.Connection): Promise<string[]> {
    // 只获取表，不包括视图
    const [rows] = await connection.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const tables: string[] = [];
    
    if (Array.isArray(rows)) {
        for (const row of rows) {
            const tableName = Object.values(row)[0] as string;
            tables.push(tableName);
        }
    }
    
    return tables;
}

async function getTableCreateStatement(connection: mysql.Connection, tableName: string): Promise<string> {
    const [rows] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    
    if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0] as any;
        // 处理普通表和视图的不同返回格式
        return row['Create Table'] || row['Create View'] || '';
    }
    
    throw new Error(`无法获取表 ${tableName} 的创建语句`);
}

async function syncTableStructure(connection: mysql.Connection, tableName: string, createStatement: string): Promise<void> {
    try {
        // 先检查表是否存在
        const [tables] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
        
        if (Array.isArray(tables) && tables.length > 0) {
            // 表已存在，删除后重建（注意：这会删除所有数据）
            await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        }
        
        // 创建表
        await connection.query(createStatement);
    } catch (error) {
        throw new Error(`同步表结构失败 (${tableName}): ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function syncTableData(localConnection: mysql.Connection, remoteConnection: mysql.Connection, tableName: string): Promise<void> {
    try {
        // 获取本地表数据
        const [rows] = await localConnection.query(`SELECT * FROM \`${tableName}\``);
        
        if (!Array.isArray(rows) || rows.length === 0) {
            // 表没有数据，跳过
            return;
        }

        // 获取列名
        const columns = Object.keys(rows[0]);
        const columnNames = columns.map(col => `\`${col}\``).join(', ');
        
        // 批量插入数据
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            const values = batch.map(row => {
                const rowValues = columns.map(col => {
                    const value = (row as any)[col];
                    if (value === null) {
                        return 'NULL';
                    }
                    if (typeof value === 'string') {
                        return mysql.escape(value);
                    }
                    if (value instanceof Date) {
                        return mysql.escape(value);
                    }
                    if (Buffer.isBuffer(value)) {
                        return mysql.escape(value);
                    }
                    return mysql.escape(String(value));
                }).join(', ');
                return `(${rowValues})`;
            }).join(', ');
            
            const insertQuery = `INSERT INTO \`${tableName}\` (${columnNames}) VALUES ${values}`;
            await remoteConnection.query(insertQuery);
        }
    } catch (error) {
        throw new Error(`同步表数据失败 (${tableName}): ${error instanceof Error ? error.message : String(error)}`);
    }
}

