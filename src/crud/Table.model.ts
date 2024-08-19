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
  create_time: Date;
  topic_for_class_id: number;
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

export type Tables =
  | 'student'
  | 'group'
  | 'discussion'
  | 'node_table'
  | 'edge_table'
  | 'argunode'
  | 'arguedge';
