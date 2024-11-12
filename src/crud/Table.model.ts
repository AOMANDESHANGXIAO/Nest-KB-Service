/**
 * 数据库表的声明
 */
export interface StudentTable {
  id: number;
  group_id: number;
  class_id: number;
  username: string;
  password: string;
  nickname: string;
}
export interface GroupTable {
  id: number;
  group_name: string;
  group_description: string;
  group_code: string;
  group_color: string;
  belong_class_id: number;
}
export interface DiscussTable {
  id: number;
  topic_content: string;
  created_time: Date;
  close_time: Date;
  topic_for_class_id: number;
  created_user_id: number;
  status: 'propose' | 'feedback' | 'summary' | 'close';
  courseWork: string; // 话题作业的内容
}
export interface DiscussAction {
  id: number;
  action: 'feedback' | 'summary' | 'close';
  discuss_id: number;
  created_time: Date;
  operator_id: number;
}
export enum NodeTypeEnum {
  idea = 'idea',
  topic = 'topic',
  group = 'group',
}
export interface NodeTable {
  id: number;
  type: NodeTypeEnum;
  class_id: number;
  group_id: number;
  student_id: number;
  topic_id: number;
  created_time: Date;
  version: number;
  content: string;
}
export interface NodeScoreTable {
  id: number;
  recognition: 0 | 1;
  understanding: 0 | 1;
  evaluation: 0 | 1;
  analysis: 0 | 1;
  create: 0 | 1;
  node_table_id: number; // PK
  version: number;
  created_time: Date;
}
export interface EdgeTable {
  id: number;
  source: number;
  target: number;
  topic_id: number;
  type: 'approve' | 'reject' | 'group_to_discuss' | 'idea_to_group';
}
export enum ArguNodeTypeEnum {
  data = 'data',
  claim = 'claim',
  warrant = 'warrant',
  rebuttal = 'rebuttal',
}
export interface ArguNodeTable {
  id: number;
  type: ArguNodeTypeEnum;
  content: string;
  arguKey: number;
  version: number;
  arguId: string;
  creator: number; // 2024/9/9 新增 creator 字段
}
export interface ArguEdgeTable {
  id: number;
  source: string;
  target: string;
  type: string;
  version: number;
  arguId: string;
  arguKey: number;
}
export interface AdminTable {
  id: number;
  username: string;
  password: string;
  nickname: string;
}
export interface Class_ {
  id: number;
  class_name: string;
  status: 1;
}
export interface StudentActionLog {
  id: number;
  action:
    | 'propose'
    | 'check_group'
    | 'check_idea'
    | 'modify_idea'
    | 'modify_group'
    | 'approve'
    | 'oppose'
    | 'summary_group';
  student_id: number;
  node_id: number;
  created_time: Date;
}
export interface Student_File_Storage {
  id: number;
  filename: string; // 文件的原名
  file_path: string; // 存放地址
  uploader_id: number;
  upload_time: Date;
  is_public: number; // 这个字段用来标记小组文件是否公有.1表示小组内部私有，0表示所有人都可见
  is_removed: number; // 这个字段用来标记文件是否被删除，1表示被删除，0表示未被删除
  removed_time: Date; // 这个字段表示文件被删除的时间
  download_count: number; // 这个字段记录被下载的次数
  topic_id: number; // 这个字段用来记录文件属于哪个话题
}
export interface Course_Work_Upload_Storage {
  id: number;
  student_id: number;
  topic_id: number;
  file_name: string; // 文件的原名
  file_path: string; // 存放地址
  upload_time: Date;
}
export type Tables =
  | 'student'
  | 'group'
  | 'discussion'
  | 'node_table'
  | 'edge_table'
  | 'argunode'
  | 'arguedge'
  | 'admin'
  | 'class'
  | 'discuss_action'
  | 'node_table_score'
  | 'student_action_log'
  | 'student_file_storage'
  | 'course_work_upload_storage';
