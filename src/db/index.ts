import config from '../config';
import * as mysql from 'mysql2/promise';
import { Tables, StudentActionLog } from 'src/crud/Table.model';

class SqlService {
  conncetion: mysql.Connection | null;
  dbConfig: typeof config.db;
  constructor() {
    // conncetion = null;
    this.dbConfig = config.db;
  }
  /**
   * 检查连接是否有效
   */
  async isConnectionValid() {
    try {
      if (this.conncetion) {
        await this.conncetion.ping(); // 检查连接是否有效
        return true;
      }
    } catch (err) {
      console.log('Connection is not valid, reconnecting...', err);
    }
    return false;
  }

  /**
   * 建立连接
   */
  async setupConnection() {
    try {
      if (!this.conncetion || !(await this.isConnectionValid())) {
        this.conncetion = await mysql.createConnection(this.dbConfig);
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
      await this.setupConnection();
      await this.conncetion.beginTransaction();
    } catch (err) {
      console.log('beginTransaction error', err);
    }
  }

  /**
   * 结束事务
   */
  async closeTransaction() {
    try {
      await this.setupConnection();
      await this.conncetion.commit();
    } catch (err) {
      console.log('closeTransaction', err);
    }
  }

  // 回滚
  async rollback() {
    try {
      await this.setupConnection();
      await this.conncetion.rollback();
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
      await this.setupConnection();
      await this.conncetion.commit();
    } catch (err) {
      console.log('commit', err);
    }
  }

  public failResponse(msg: string) {
    return {
      message: msg,
      success: false,
    };
  }

  // 简易的sql生成器，不涉及join时可用
  generateSelectSql<T extends object>(
    tablename: string,
    columns: Array<keyof T>,
    where?:
      | Array<{
          field: string;
          value: string | number;
          charset?: '=' | '>' | '<' | '!=' | '>=' | '<=' | 'LIKE' | 'IN';
        }>
      | {
          field: string;
          value: string | number | string[] | number[];
          charset?: '=' | '>' | '<' | '!=' | '>=' | '<=' | 'LIKE' | 'IN';
        },
  ) {
    let whereSql: string = '';

    if (where instanceof Array) {
      whereSql = where
        .map(
          (item) =>
            `${item.field} ${item.charset || '='} ${this.handleSqlValues(item.value)}`,
        )
        .join(' AND ');
    } else if (typeof where === 'object') {
      whereSql = `${where.field} ${where.charset || '='} ${this.handleSqlValues(where.value)}`;
    }
    whereSql && (whereSql = `WHERE ${whereSql}`);
    return `SELECT ${columns.join(',')} FROM \`${tablename}\` ${whereSql}`;
  }

  // 查询
  async query<T = any>(sql: string): Promise<T[]> {
    try {
      await this.setupConnection();
      const [rows] = await this.conncetion.execute(sql);
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
    if (v === 'NOW') {
      return 'NOW()';
    }

    if (typeof v === 'string') {
      return `'${v}'`;
    } else {
      return v;
    }
  }

  handleWhereList(whereList: (string | number)[]) {
    return `[${whereList.map((item) => this.handleValue(item)).join(',')}]`;
  }

  handleSqlValues(values: (string | number)[] | string | number) {
    // console.log('values:', typeof values);
    if (typeof values === 'string' || typeof values === 'number') {
      return this.handleValue(values);
    } else {
      return this.handleWhereList(values);
    }
  }

  generateInsertSql<T>(
    tableName: Tables,
    columns: Array<keyof T>,
    values: Array<(string | number | 'NOW')[]>,
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
    // 如果只有一行数据，那么除去最后一个 ',' 号
    if (values.length === 1) {
      valuesSql.slice(0, valuesSql.length - 1);
    }

    const sql = `INSERT INTO \`${tableName}\` (${columns.join(',')}) VALUES ${valuesSql};`;

    return sql;
  }

  // 新增
  async insert(sql: string): Promise<string> {
    try {
      await this.setupConnection();
      const [rows] = await this.conncetion.execute(sql);
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
    tableName: Tables,
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
      await this.setupConnection();
      const [rows] = await this.conncetion.execute(sql);
      return rows;
    } catch (err) {
      throw err;
    }
  }
  // log方法
  async log({
    action,
    student_id,
    node_id,
  }: {
    action: StudentActionLog['action'];
    student_id: StudentActionLog['student_id'];
    node_id?: StudentActionLog['node_id'];
  }) {
    const columns: Array<keyof StudentActionLog> = node_id
      ? ['action', 'student_id', 'node_id', 'created_time']
      : ['action', 'student_id', 'created_time'];
    const values: Array<string | number> = node_id
      ? [action, student_id, node_id, 'NOW']
      : [action, student_id, 'NOW'];
    await this.insert(
      this.generateInsertSql<StudentActionLog>('student_action_log', columns, [
        values,
      ]),
    );
  }
}
// export default new SqlService();
export { SqlService };
