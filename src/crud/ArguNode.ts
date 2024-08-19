import { SqlService } from 'src/db';
// import { ArguNodeTable } from './Table.model';
import { CRUDer } from './index';

export default class ArguNodeCruder implements CRUDer {
  s: SqlService;
  constructor(sqlService: SqlService) {
    this.s = sqlService;
  }

  // 依据arguKey查询最新版本
  public async FindLatestVersion(arguKey: number) {
    const [version] = await this.s.query<{ version: number }>(
      `SELECT MAX(version) version FROM argunode WHERE arguKey = ${arguKey}`,
    );
    return version.version;
  }
}
