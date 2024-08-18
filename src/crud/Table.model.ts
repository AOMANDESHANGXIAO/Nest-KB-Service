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

export type Tables = 'student' | 'group' | 'discussion';
