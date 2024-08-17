import { SqlService } from 'src/db';

// 每一个增删改查类都需要继承这个接口
export interface CRUDer {
  s: SqlService;
}
