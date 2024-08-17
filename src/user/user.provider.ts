/**
 * 提供给其他模块可用的对学生操作
 */
import { SqlService } from '../db/index';

export default class UserProvider extends SqlService {
  constructor() {
    super();
  }

  public async selectUserById(id: number) {
    const sql = `SELECT * FROM student WHERE id = ${id}`;
    const [res] = await this.query(sql);
    return res;
  }
}
