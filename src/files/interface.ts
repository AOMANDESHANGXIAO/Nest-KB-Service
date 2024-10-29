import { QueryParams } from 'src/crud/index';

export interface FileQueryParams extends QueryParams {
  group_id?: number; // 查询小组上传的文件
  topic_id: number; // 查询哪一个话题下的文件
}
