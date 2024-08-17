import { SqlService } from 'src/db';
import { StudentTable } from './Table.model';
import { CRUDer } from './index';

export interface StudentCRUD extends CRUDer {
  selectOneById: (id: number) => Promise<StudentTable>;
}

class StudentCRUDer implements StudentCRUD {
  s: SqlService;
  constructor(serviceInstance: SqlService) {
    this.s = serviceInstance;
  }

  public async selectOneById(id: number): Promise<StudentTable> {
    const sql = `SELECT * FROM student WHERE id = ${id}`;
    const [res] = await this.s.query(sql);
    return res as StudentTable;
  }
}

export default StudentCRUDer;
