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
  status: 'propose' | 'feedback' | 'summary' | 'close';
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
  | 'node_table_score';
