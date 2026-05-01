import path from 'path';
import type { ObjectLiteral, Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { getAppConfig } from '../../utils';
import { User } from './entities/User';

// https://juejin.cn/post/7424425429699198991
const appConf = getAppConfig();
const { databaseName = 'database.sql' } = appConf;
export const AppDataSource = new DataSource({
  synchronize: true,
  logging: true,
  type: 'better-sqlite3',
  database: databaseName,
  entities: [User],
  nativeBinding: path.join(path.dirname(__dirname), 'dist-native/better_sqlite3.node'),
});

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: DataSource | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }

    return DatabaseManager.instance;
  }

  public async connect(): Promise<DataSource> {
    if (!this.connection) {
      this.connection = await AppDataSource.initialize();
    }

    return this.connection;
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.destroy();
      this.connection = null;
    }
  }

  public async getRepository<T extends ObjectLiteral>(entity: {
    new (): T;
  }): Promise<Repository<T>> {
    await this.connect();
    if (!this.connection) {
      throw new Error('database connection not established');
    }
    return this.connection.getRepository(entity);
  }
}
