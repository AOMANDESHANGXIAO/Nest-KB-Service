import { Injectable, HttpException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { SqlService } from '../db/index';
import { User, Login } from '../models/User';

@Injectable()
export class UserService extends SqlService {
  create(createUserInput: CreateUserDto) {
    const { username } = createUserInput;
    if (this.findOneByUsername(username)) {
      return '用户已存在';
    } else {
      return 'This action adds a new user';
    }
  }

  async login(param: Login) {
    const { username, password } = param;

    const isExist = await this.findOneExist(username);
    if (!isExist) {
      throw new HttpException('用户名不存在', 400);
    }
    return '登录成功';
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOneExist(key: number | string): Promise<boolean> {
    if (typeof key === 'number') {
      return false;
    } else if (typeof key === 'string') {
      const res = await this.findOneByUsername(key);
      return res.length > 0;
    }
    return false;
  }

  async findOneByUsername(username: string) {
    const sql = `SELECT * FROM student WHERE username = '${username}'`;

    const result = await this.query<User>(sql);
    // console.log('findOneByUsername', result);

    return result;
  }

  update(id: number) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
