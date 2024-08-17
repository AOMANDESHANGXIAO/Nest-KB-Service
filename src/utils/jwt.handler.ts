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

  async verify(token: string): Promise<boolean> {
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
    return new Promise((resolve, reject) => {
      if (ignoreRoutes.includes(route)) {
        resolve(true);
      }
      this.verify(token)
        .then((isValid) => {
          resolve(isValid);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
