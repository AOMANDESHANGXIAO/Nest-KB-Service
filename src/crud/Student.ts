import { SqlService } from 'src/db';
import { Student } from './Table.model';
import { CRUDer } from './index';

export interface StudentCRUD extends CRUDer {
  selectOneById: (id: number) => Promise<Student>;
}

class StudentCRUDer implements StudentCRUD {
  s: SqlService;
  constructor(serviceInstance: SqlService) {
    this.s = serviceInstance;
  }

  public async selectOneById(id: number): Promise<Student> {
    const sql = `SELECT * FROM student WHERE id = ${id}`;
    const [res] = await this.s.query(sql);
    return res as Student;
  }

  public async updateOne(
    columValues: Array<{ column: string; value: string | number }>,
    where: Array<{
      column: keyof Student;
      value: string | number | string[] | number[];
      charset?: '=' | '>' | '<' | '!=' | '>=' | '<=' | 'LIKE' | 'IN';
    }>,
  ) {
    return this.s.update(
      this.s.generateUpdateSql('student', columValues, where),
    );
  }
}

export default StudentCRUDer;
