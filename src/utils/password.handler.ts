import * as bcrypt from 'bcrypt';

export default class PasswordHandles {
  saltRounds: number;
  constructor() {
    this.saltRounds = 10;
  }

  hasdPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, this.saltRounds, function (err, hash) {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hashedPassword, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }
}
