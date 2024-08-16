import config from './config';
import * as mysql from 'mysql2/promise';

const test = async () => {
  try {
    const connection = await mysql.createConnection(config);
    const sql = 'SELECT * FROM student';
    const [rows] = await connection.execute(sql);
    console.log(rows);
  } catch (err) {
    console.log('连接失败..', err);
  }
};
test();
