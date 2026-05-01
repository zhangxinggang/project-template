import type { ObjectLiteral, Repository } from 'typeorm';
import { DatabaseManager } from '../index';

export class BaseRepository<T extends ObjectLiteral> {
  private repository: Repository<T> | null = null;
  private entity: { new (): T };

  constructor(entity: { new (): T }) {
    this.entity = entity;
  }

  public async getRepository(): Promise<Repository<T>> {
    if (!this.repository) {
      this.repository = await DatabaseManager.getInstance().getRepository<T>(this.entity);
    }

    return this.repository;
  }
}
