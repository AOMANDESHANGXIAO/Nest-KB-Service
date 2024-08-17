import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db/index';
import { CreateDto, GroupTable, JoinDto } from './Models/index';

@Injectable()
export class GroupService extends SqlService {
  constructor() {
    super();
  }

  public async create({
    group_name,
    group_color,
    group_description,
    student_id,
    class_id,
  }: CreateDto) {
    // 查询学生是否有团队
    let [group] = await this.selectGroupByStudentId(student_id);
    if (group) {
      throw new Error('student has group');
    }
    // 查询组名是否重复
    group = (await this.selectGroupByGroupname(group_name, class_id))[0];
    if (group) {
      throw new Error('group name exists');
    }
    // 创建团队
    await this.beginTransaction();

    const groupId = await this.insert(
      this.generateInsertSql(
        'group',
        ['group_name', 'group_color', 'group_description', 'belong_class_id'],
        [[group_name, group_color, group_description, class_id]],
      ),
    );
    // 更新学生的团队id以及group的团队码为ckcXXX
    await Promise.all([
      this.update(
        this.generateUpdateSql(
          'student',
          [{ column: 'group_id', value: groupId }],
          [{ column: 'id', value: student_id, charset: '=' }],
        ),
      ),
      this.update(
        this.generateUpdateSql(
          'group',
          [{ column: 'group_code', value: `ckc${groupId}` }],
          [{ column: 'id', value: +groupId, charset: '=' }],
        ),
      ),
    ]);

    const newGroup = await this.selectGroupByGroupId(+groupId);

    await this.commit();
    await this.closeTransaction();

    return {
      data: {
        group_id: newGroup.id,
        group_name: newGroup.group_name,
        group_color: newGroup.group_color,
        group_description: newGroup.group_description,
        group_code: newGroup.group_code,
        belong_class_id: newGroup.belong_class_id,
      },
    };
  }

  public async join({ student_id, group_code }: JoinDto) {
    const [group, user] = await Promise.all([
      this.selectGroupByOneField('group_code', group_code),
      this.selectStudentById(student_id),
    ]);

    if (group || !user) {
      throw new HttpException('Already in group or user not found', 400);
    }

    this.transaction(async () => {
      await this.update(
        this.generateUpdateSql(
          'student',
          [{ column: 'group_id', value: group.id }],
          [{ column: 'id', value: student_id, charset: '=' }],
        ),
      );
    });

    return {
      data: {
        group_id: group.id,
        group_name: group.group_name,
        group_code: group.group_code,
        group_color: group.group_color,
        group_description: group.group_description,
        belong_class_id: group.belong_class_id,
      },
    };
  }

  private async selectGroupByOneField(field: string, value: string | number) {
    const sql = `SELECT * FROM \`group\` WHERE ${field} = ${this.handleValue(value)}`;

    const [res] = await this.query<GroupTable>(sql);

    return res;
  }

  private async selectGroupByGroupId(id: number) {
    const sql = `SELECT * FROM \`group\` WHERE id = ${id}`;
    const [res] = await this.query<GroupTable>(sql);
    return res;
  }

  private async selectGroupByStudentId(id: number) {
    const sql = `
    SELECT
      t1.belong_class_id,
      t1.group_code,
      t1.group_color,
      t1.group_description,
      t1.group_name,
      t1.id 
    FROM
      \`group\` t1
      JOIN student t2 ON t1.id = t2.group_id 
    WHERE
      t2.id = ${id}`;

    const res = await this.query<GroupTable>(sql);

    return res;
  }

  private async selectGroupByGroupname(name: string, classId: number) {
    const sql = `SELECT * FROM \`group\` WHERE group_name = '${name}' and belong_class_id = ${classId}`;

    const res = await this.query<GroupTable>(sql);

    return res;
  }

  private async selectStudentById(id: number) {
    const sql = `SELECT * FROM student WHERE id = ${id}`;
    const [res] = await this.query(sql);
    return res;
  }
}
