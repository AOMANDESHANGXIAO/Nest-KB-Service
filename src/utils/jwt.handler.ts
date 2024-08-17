import * as jwt from 'jsonwebtoken';
import config from '../user/config';

const { secretKey, expiresIn, ignoreRoutes } = config.jwt;

export default class JwtHandler {
  secretKey: string;
  expiresIn: string;
  constructor() {
    this.secretKey = secretKey;
    this.expiresIn = expiresIn;
  }

  generateJwt(payload: string) {
    return jwt.sign({ payload }, this.secretKey, { expiresIn: this.expiresIn });
  }

  verify(token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secretKey, (err) => {
        if (err) {
          reject(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async validate(route: string, token: string): Promise<boolean> {
    if (ignoreRoutes.includes(route)) {
      return true;
    }

    if (!token) {
      return false;
    }

    const isValid = await this.verify(token);

    return isValid;
  }
}
