import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import ClassroomCruder from 'src/crud/Classroom';
import { Class_ } from 'src/crud/Table.model';

@Injectable()
export class ClassroomService extends SqlService {
  classroomCruder: ClassroomCruder;
  constructor() {
    super();
    this.classroomCruder = new ClassroomCruder(this);
  }
  public async findAll() {
    return {
      data: {
        list: await this.classroomCruder.queryAllClassroom(),
      },
    };
  }

  /**
   * 查找一个班级的所有学生
   */
  public async findOneUser({
    id,
    page = 1,
    pageSize = 10,
  }: {
    id: number;
    page?: number;
    pageSize?: number;
  }) {
    // 查询学生总数
    const totalSql = `
    SELECT COUNT(*) as total
    FROM student s
    JOIN \`group\` g ON g.id = s.group_id
    WHERE s.class_id = ${id}
`;
    const [totalResult] = await this.query<{ total: number }>(totalSql);
    const total = totalResult.total;

    const sql = `
    SELECT
      s.group_id,
      s.id,
      s.nickname,
      s.username,
      g.group_name,
      g.group_description,
      g.group_code 
    FROM
      student s
      JOIN \`group\` g ON g.id = s.group_id
    WHERE s.class_id = ${id}
    LIMIT ${(page - 1) * pageSize}, ${pageSize}`;

    const result = await this.query<{
      group_id: number;
      id: number;
      nickname: string;
      username: string;
      group_name: string;
      group_description: string;
      group_code: string;
    }>(sql);

    return {
      data: {
        list: result,
        totalNum: total,
      },
    };
  }

  public async create(className: string) {
    await this.transaction(async () => {
      await this.insert(
        this.generateInsertSql<Class_>(
          'class',
          ['class_name', 'status'],
          [[className, 1]],
        ),
      );
    });
    return {
      data: {},
      message: '创建成功',
    };
  }

  public async delete(id: number) {
    await this.transaction(async () => {
      await this.update(
        this.generateUpdateSql<Class_>(
          'class',
          [{ column: 'status', value: 0 }],
          [{ column: 'id', value: id, charset: '=' }],
        ),
      );
    });
    return {
      data: {},
      message: '删除成功',
    };
  }
}
