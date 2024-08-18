import { Injectable } from '@nestjs/common';
import { SqlService } from '../db';
// import { DiscussTable } from 'src/crud/Table.model';
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

  findOne(id: number) {
    return `This action returns a #${id} discuss`;
  }

  updateDiscuss(id: number) {
    return `This action updates a #${id} discuss`;
  }

  remove(id: number) {
    return `This action removes a #${id} discuss`;
  }
}
