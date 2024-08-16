import config from './config';
import mysql from 'mysql2/promise';

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
      if (!this.conn) {
        await this.getConn();
      }
      await this.conn.beginTransaction();
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * 结束事务
   */
  async cloasTransaction() {
    try {
      if (!this.conn) {
        await this.getConn();
      }
      await this.conn.commit();
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * 提交
   */
  async commit() {
    try {
      if (!this.conn) {
        await this.getConn();
      }
      await this.conn.commit();
    } catch (err) {
      console.log(err);
    }
  }

  /**
   *
   * @param sql sql语句
   * @returns
   * @description 执行sql
   */
  async query(sql: string) {
    try {
      if (!this.conn) {
        await this.getConn();
      }
      const [rows] = await this.conn.execute(sql);
      return rows;
    } catch (err) {
      console.log(err);
    }
  }
}

export { SqlService };
