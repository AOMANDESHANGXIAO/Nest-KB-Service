import { HttpException, Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import { Login, Register } from './auth.controller';
import PasswordHandler from 'src/utils/password.handler';
import JwtHandler from 'src/utils/jwt.handler';

class AuthTool {
  static async findOneExist(username: string, service: SqlService) {
    const sql = `SELECT * FROM admin WHERE username = '${username}'`;
    const [res] = await service.query(sql);
    if (res) {
      return true;
    }
    return false;
  }
  static async findOneByUsername(username: string, service: SqlService) {
    const sql = `SELECT * FROM admin WHERE username = '${username}'`;
    const [res] = await service.query<{
      username: string;
      nickname: string;
      password: string;
      id: number;
    }>(sql);
    return res;
  }
}

@Injectable()
export class AuthService extends SqlService {
  pwdHandler: PasswordHandler;
  jwtHandler: JwtHandler;
  constructor() {
    super();
    this.pwdHandler = new PasswordHandler();
    this.jwtHandler = new JwtHandler();
  }

  /**
   * 管理员登录
   */
  public async login(loginParams: Login) {
    // 1. 检查用户名是否存在
    const { username, password } = loginParams;
    const admin = await AuthTool.findOneByUsername(username, this);
    if (!admin) {
      throw new HttpException('用户不存在', 400);
    }

    // 2. 匹配密码
    const isMatch = await this.pwdHandler.comparePassword(
      password,
      admin.password,
    );
    if (!isMatch) {
      throw new HttpException('密码错误', 400);
    }

    // 3. 生成token
    const token = this.jwtHandler.generateJwt(username);

    // 4. 返回
    return {
      data: {
        token,
        nickname: admin.nickname,
        username: admin.username,
        id: admin.id,
      },
      message: '登录成功',
    };
  }

  /**
   * 管理员注册
   */
  public async register(params: Register) {
    // 1. 检查用户名是否存在
    const { username, password, nickname } = params;
    const isExist = await AuthTool.findOneExist(username, this);
    if (isExist) {
      throw new HttpException('用户名已存在', 400);
    }

    // 2. 注册
    await this.transaction(async () => {
      const hashedPassword = await this.pwdHandler.hasdPassword(password);
      this.insert(
        this.generateInsertSql(
          'admin',
          ['username', 'password', 'nickname'],
          [[username, hashedPassword, nickname]],
        ),
      );
    });

    // 3. 返回
    return {
      message: '注册成功',
      data: {},
    };
  }
}
