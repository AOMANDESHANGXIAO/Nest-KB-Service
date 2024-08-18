import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db/index';
import { CreateDto, JoinDto } from './Models/index';
import StudentCRUDer from 'src/crud/Student';
import GroupCRUDer from 'src/crud/Group';
import { GroupTable } from 'src/crud/Table.model';

@Injectable()
export class GroupService extends SqlService {
  studentCrud: StudentCRUDer;
  groupCrud: GroupCRUDer;
  constructor() {
    super();
    this.studentCrud = new StudentCRUDer(this);
    this.groupCrud = new GroupCRUDer(this);
  }

  public async create({
    group_name,
    group_color,
    group_description,
    student_id,
    class_id,
  }: CreateDto) {
    // 查询学生是否有团队
    let group = await this.groupCrud.selectGroupByStudentId(student_id);
    if (group) {
      throw new Error('student has group');
    }
    // 查询组名是否重复
    group = await this.groupCrud.selectGroupByGroupname(group_name, class_id);
    if (group) {
      throw new Error('group name exists');
    }
    // 创建团队
    let newGroup: GroupTable;
    this.transaction(async () => {
      const groupId = await this.insert(
        this.generateInsertSql<GroupTable>(
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

      newGroup = await this.groupCrud.selectGroupByGroupId(+groupId);
    });

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
      this.groupCrud.selectGroupByOneField('group_code', group_code),
      this.studentCrud.selectOneById(student_id),
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

  /**
   *
   * @param id groupId
   * @description 根据小组id查询小组分享反馈、总结的数据
   */
  public async queryGroupCollData(id: number) {
    const res = await this.groupCrud.queryShareFeedbackSummaryNumByGroupId(+id);

    return {
      data: {
        list: [
          {
            iconName: 'discussion',
            text: '参与了讨论',
            num: res.feedback + res.share + res.summary,
          },
          {
            iconName: 'share',
            text: '分享了观点',
            num: res.share,
          },
          {
            iconName: 'feedback',
            text: '反馈了观点',
            num: res.feedback,
          },
          {
            iconName: 'summary',
            text: '总结了讨论',
            num: res.summary,
          },
        ],
      },
    };
  }
}
