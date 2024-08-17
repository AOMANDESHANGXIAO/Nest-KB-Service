import { Injectable, HttpException } from '@nestjs/common';
import { SqlService } from '../db/index';
import { User, Login, Create } from '../models/User';
import PasswordHandles from '../utils/password.handler';
import JwtHandler from '../utils/jwt.handler';

@Injectable()
export class UserService extends SqlService {
  pwdHandler: PasswordHandles;
  jwtHandler: JwtHandler;
  constructor() {
    super();
    this.pwdHandler = new PasswordHandles();
    this.jwtHandler = new JwtHandler();
  }

  async create(createUserInput: Create) {
    const { username, password, nickname, class_id } = createUserInput;

    const isExist = await this.findOneExist(username);
    if (isExist) {
      throw new HttpException('用户名已存在', 400);
    } else {
      this.beginTransaction();

      const hashedPassword = await this.pwdHandler.hasdPassword(password);

      const sql = `INSERT INTO student (username, password, nickname, class_id) VALUES ('${username}', '${hashedPassword}', '${nickname}', ${class_id})`;

      try {
        await this.insert(sql);
        await this.closeTransaction();
        await this.commit();
        return {
          message: '创建用户成功',
          data: {},
        };
      } catch (err) {
        throw new HttpException('创建用户失败', 400);
      }
    }
  }

  async login(param: Login) {
    const { username, password } = param;

    // 判断用户是否存在
    const isExist = await this.findOneExist(username);
    if (!isExist) {
      throw new HttpException('用户不存在', 400);
    }

    // 判断密码是否正确
    const [user] = await this.findOneByUsername(username);

    const isMatch = await this.pwdHandler.comparePassword(
      password,
      user.password,
    );

    if (!isMatch) {
      throw new HttpException('密码错误', 400);
    }

    // 查询用户的小组信息
    const [groupInfo] = await this.findUserGroupById(+user.group_id);

    return {
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        group_id: user.group_id,
        class_id: user.class_id,
        group_name: groupInfo?.group_name || null,
        group_code: groupInfo?.group_code || null,
        group_color: groupInfo?.group_color || null,
        token: this.jwtHandler.generateJwt(user.username),
      },
    };
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

  async findOneByUsername(username: string): Promise<User[]> {
    const sql = `SELECT * FROM student WHERE username = '${username}'`;

    const result = await this.query<User>(sql);
    // console.log('findOneByUsername', result);

    return result;
  }

  async findUserGroupById(id: number) {
    const sql = `
    SELECT 
    id, 
    group_color,
    group_name,
    group_code
    FROM \`group\` t1 WHERE t1.id = ${id}
  `;

    const result = await this.query<{
      id: number;
      group_color: string;
      group_name: string;
      group_code: string;
    }>(sql);

    return result;
  }
}
