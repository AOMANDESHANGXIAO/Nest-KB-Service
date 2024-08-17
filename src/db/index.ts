import config from '../config';
import * as mysql from 'mysql2/promise';
import { Tables } from 'src/crud/Table.model';

class SqlService {
  conn: mysql.Connection | null;
  dbConfig: typeof config.db;
  constructor() {
    this.conn = null;
    this.dbConfig = config.db;
  }

  /**
   * 获取数据库连接
   */
  async getConn() {
    try {
      if (!this.conn) {
        this.conn = await mysql.createConnection(this.dbConfig);
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

  // 回滚
  async rollback() {
    try {
      await this.getConn();
      await this.conn.rollback();
    } catch (err) {
      console.log('rollback', err);
      throw err;
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

  // 处理事务
  async transaction(callback: () => Promise<any>) {
    this.beginTransaction();
    try {
      await callback();
      this.commit();
    } catch (err) {
      this.rollback();
      throw err;
    }
  }

  handleValue(v: string | number) {
    if (typeof v === 'string') {
      return `'${v}'`;
    } else {
      return v;
    }
  }

  handleWhereList(whereList: (string | number)[]) {
    return `[${whereList.map((item) => this.handleValue(item)).join(',')}]`;
  }

  generateInsertSql<T>(
    tableName: Tables,
    columns: string[] | Array<keyof T>,
    values: Array<(string | number)[]>,
  ) {
    // 验证输入是否有效
    if (
      !tableName ||
      !columns ||
      columns.length === 0 ||
      !values ||
      values.length === 0
    ) {
      throw new Error('invalid input');
    }
    const valuesSql = values
      .map((value) => {
        return `(${value.map((v) => this.handleValue(v)).join(',')})`;
      })
      .join(',');

    const sql = `INSERT INTO \`${tableName}\` (${columns.join(',')}) VALUES ${valuesSql};`;

    return sql;
  }

  // 新增
  async insert(sql: string): Promise<string> {
    try {
      await this.getConn();
      const [rows] = await this.conn.execute(sql);
      return (rows as unknown as { insertId: string }).insertId;
    } catch (err) {
      throw err;
    }
  }

  generateColumnValusByObj<T extends object>(
    obj: object | T,
    filters: string[] = [],
  ): Array<{ column: string | keyof T; value: string | number }> {
    return Object.keys(obj)
      .filter((key) => !filters.includes(key))
      .map((key) => {
        return {
          column: key,
          value: obj[key],
        };
      });
  }

  generateUpdateSql<T>(
    tableName: string,
    columValues: Array<{ column: string | keyof T; value: string | number }>,
    where: Array<{
      column: string | keyof T;
      value: string | number | string[] | number[];
      charset?: '=' | '>' | '<' | '!=' | '>=' | '<=' | 'LIKE' | 'IN';
    }>,
  ) {
    // 验证输入是否有效
    if (!tableName || !columValues || columValues.length === 0) {
      throw new Error('invalid input in generateUpdateSql');
    }

    const sql = columValues
      .map((columValue) => {
        return `${String(columValue.column)} = ${this.handleValue(columValue.value)}`;
      })
      .join(', ');
    const whereSql = where
      .map((w) => {
        return `${String(w.column)} ${w.charset || '='} ${['number', 'string'].includes(typeof w.value) ? this.handleValue(w.value as string | number) : this.handleWhereList(w.value as (string | number)[])}`;
      })
      .join(' AND ');

    return `UPDATE \`${tableName}\` SET ${sql} WHERE ${whereSql};`;
  }

  async update(sql: string) {
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
