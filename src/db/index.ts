import config from './config';
import * as mysql from 'mysql2/promise';

class SqlService {
  conn: mysql.Connection | null;
  constructor() {
    this.conn = null;
  }

  /**
   * 获取数据库连接
   */
  async getConn() {
    try {
      if (!this.conn) {
        this.conn = await mysql.createConnection(config);
        console.log('Connection success');
        return;
      }
      console.log('Connection has been created');
    } catch (err) {
      console.log('Connection error: ', err);
    }
  }

  /**
   * 开始事务
   */
  async beginTransaction() {
    try {
      await this.getConn();
      await this.conn.beginTransaction();
    } catch (err) {
      console.log('beginTransaction error', err);
    }
  }

  /**
   * 结束事务
   */
  async closeTransaction() {
    try {
      await this.getConn();
      await this.conn.commit();
    } catch (err) {
      console.log('closeTransaction', err);
    }
  }

  /**
   * 提交
   */
  async commit() {
    try {
      await this.getConn();
      await this.conn.commit();
    } catch (err) {
      console.log('commit', err);
    }
  }

  // 查询
  async query<T = any>(sql: string): Promise<T[]> {
    try {
      await this.getConn();
      // console.log('this.conn ==>', this.conn);
      const [rows] = await this.conn.execute(sql);
      return rows as T[];
    } catch (err) {
      throw err;
    }
  }

  // 新增
  async insert(sql: string) {
    try {
      await this.getConn();
      const [rows] = await this.conn.execute(sql);
      return rows;
    } catch (err) {
      throw err;
    }
  }
}

export { SqlService };
