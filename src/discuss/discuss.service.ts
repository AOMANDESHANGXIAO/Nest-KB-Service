import { Injectable } from '@nestjs/common';
import { SqlService } from '../db';
import { DiscussTable } from 'src/crud/Table.model';
import { FindAllQueryInput } from './Models/index';
import DiscussionCRUDer from '../crud/Discussion';

@Injectable()
export class DiscussService extends SqlService {
  discussCruder: DiscussionCRUDer;
  constructor() {
    super();
    this.discussCruder = new DiscussionCRUDer(this);
  }
  create() {
    return 'This action adds a new discuss';
  }

  public async findAll({ class_id, content, sort }: FindAllQueryInput) {
    const list = await this.discussCruder.queryDiscussionByClassId(
      class_id,
      sort,
      content,
    );

    return {
      data: {
        list,
      },
    };
  }

  /**
   *
   * @param id discuss id
   * @returns DiscussTable
   * @description 返回一个discuss的内容
   */
  public async findOne(id: number) {
    const [res] = await this.query<DiscussTable>(
      `SELECT id, topic_content, created_time FROM discussion WHERE id = ${id}`,
    );
    // console.log(res);
    return {
      data: res,
    };
  }

  updateDiscuss(id: number) {
    return `This action updates a #${id} discuss`;
  }

  remove(id: number) {
    return `This action removes a #${id} discuss`;
  }
}
