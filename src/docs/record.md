`user.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { SqlService } from '../db/index';
import { User } from '../models/User';

@Injectable()
export class UserService extends SqlService {
  create(createUserInput: CreateUserInput) {
    const { username } = createUserInput;
    if (this.findOneByUsername(username)) {
      return '用户已存在';
    } else {
      return 'This action adds a new user';
    }
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOneExist(key: number | string) {
    if (typeof key === 'number') {
    } else if (typeof key === 'string') {
      const res = await this.findOneByUsername(key);
      return res.length > 0;
    }
  }

  async findOneByUsername(username: string) {
    const sql = `SELECT * FROM student WHERE username = '${username}'`;

    const result = this.query<User>(sql);

    return result;
  }

  update(id: number, updateUserInput: UpdateUserInput) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}

```

`dto/create-user.input.ts`

```ts
import { InputType, String, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field(() => String, { description: '用户名' })
  username: string;

  @Field(() => String, { description: '密码' })
  password: string;
}

```

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoiYWRtaW4iLCJpYXQiOjE3MjM4NTYyNTMsImV4cCI6MTcyMzg1NjI2OH0.hEjG5OdJiY0qRDejsWCgT3uRnQCNvhPcepY0WdTI5-o

