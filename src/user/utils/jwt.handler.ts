import * as jwt from 'jsonwebtoken';

export default class JwtHandler {
  secretKey: string;
  expiresIn: string;
  constructor() {
    this.secretKey = 'TheRidiculousAdventurer';
    this.expiresIn = '30d';
  }

  generateJwt(payload: string) {
    return jwt.sign({ payload }, this.secretKey, { expiresIn: this.expiresIn });
  }
}
