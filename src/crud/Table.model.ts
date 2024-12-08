/**
 * 数据库表的声明
 */
/**
 * 记录学生
 */
export interface StudentTable {
  id: number;
  group_id: number;
  class_id: number;
  username: string;
  password: string;
  nickname: string;
}
/**
 * 记录小组
 */
export interface GroupTable {
  id: number;
  group_name: string;
  group_description: string;
  group_code: string;
  group_color: string;
  belong_class_id: number;
}
/**
 * 记录讨论
 */
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
/**
 * 记录讨论行为
 */
export interface DiscussAction {
  id: number;
  action: 'feedback' | 'summary' | 'close';
  discuss_id: number;
  created_time: Date;
  operator_id: number;
}
/**
 * 观点图谱节点类型
 */
export enum NodeTypeEnum {
  idea = 'idea',
  topic = 'topic',
  group = 'group',
  question = 'question',
}
/**
 * 记录观点图谱节点
 */
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
export interface NodeTableReviseLogger {
  id: number;
  node_id: number;
  content: string;
  version: number;
  created_time: Date;
  student_id: number;
}
/**
 * 记录观点图谱节点评分
 */
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
/**
 * 记录观点图谱边
 */
export interface EdgeTable {
  id: number;
  source: number;
  target: number;
  topic_id: number;
  type:
    | 'approve'
    | 'reject'
    | 'group_to_discuss'
    | 'idea_to_group'
    | 'question_to_idea'
    | 'response_to_question';
}
/**
 * 论辩节点类型
 */
export enum ArguNodeTypeEnum {
  data = 'data',
  claim = 'claim',
  warrant = 'warrant',
  rebuttal = 'rebuttal',
}
/**
 * 记录论辩节点
 */
export interface ArguNodeTable {
  id: number;
  type: ArguNodeTypeEnum;
  content: string;
  arguKey: number;
  version: number;
  arguId: string;
  creator: number; // 2024/9/9 新增 creator 字段
}
/**
 * 记录论辩边
 */
export interface ArguEdgeTable {
  id: number;
  source: string;
  target: string;
  type: string;
  version: number;
  arguId: string;
  arguKey: number;
}
/**
 * 记录管理员
 */
export interface AdminTable {
  id: number;
  username: string;
  password: string;
  nickname: string;
}
/**
 * 记录班级
 */
export interface Class_ {
  id: number;
  class_name: string;
  status: 1;
}
/**
 * 记录学生行为
 */
export interface StudentActionLog {
  id: number;
  action:
    | 'upload_file'
    | 'propose'
    | 'check_group'
    | 'check_idea'
    | 'modify_idea'
    | 'modify_group'
    | 'approve'
    | 'oppose'
    | 'summary_group'
    | 'chat_gpt' // 发送给gpt消息行为
    | 'question' // 提问行为
    | 'check_question' // 查看问题行为
    | 'response_question'; // 回答问题行为
  student_id: number;
  node_id: number;
  created_time: Date;
}
/**
 * 记录学生上传的文件
 */
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
/**
 * 记录学生上传的作业
 */
export interface Course_Work_Upload_Storage {
  id: number;
  student_id: number;
  topic_id: number;
  file_name: string; // 文件的原名
  file_path: string; // 存放地址
  upload_time: Date;
}
/**
 * 记录学生与gpt的聊天记录
 */
export interface Chat_Message_Storage {
  id: number;
  student: number;
  topic: number;
  message: string;
  created_time: Date;
  success: number;
}
export const SUCCESS_CHAT = 1;
export const FAILED_CHAT = 0;
/**
 * ViewPoint接口，表示记录所有观点的结构
 * 对应数据库中的ViewPoint表
 */
export const VIEWPOINT_NO_TARGET = -1;
export const VIEWPOINT_REMOVED = 1;
export const VIEWPOINT_NOT_REMOVED = 0;
export enum VIEWPOINT_TYPE {
  TOPIC = 'topic',
  GROUP = 'group',
  IDEA = 'idea',
  AGREE = 'agree',
  DISAGREE = 'disagree',
  ASK = 'ask',
  RESPONSE = 'response',
}
export interface ViewPoint {
  /**
   * 标记主键，自增的唯一标识符
   */
  id: number;
  /**
   * 观点的类型，取值范围为'topic'|'group'|'idea'|'agree'|'disagree'|'ask'|'response'
   */
  type: VIEWPOINT_TYPE;
  /**
   * 当type为'topic'时对应的班级ID，可选属性（可能为null或undefined）
   */
  class_id: number;
  /**
   * 当type为'group'时对应的小组ID，可选属性（可能为null或undefined）
   */
  group_id: number;
  /**
   * 当type为'idea'、'agree'、'disagree'、'ask'、'response'时对应的学生ID，可选属性（可能为null或undefined）
   */
  student_id: number;
  /**
   * 关联的话题ID，必填属性
   */
  topic_id: number;
  /**
   * 观点创建的时间，必填属性
   */
  created_time: Date;
  /**
   * 描述指向的Node的id（即指向本表的id），用于依据此生成edge，必填属性
   */
  target: number;
  /**
   * 描述是否被删除，1表示未被删除，0表示被删除，一旦有指向该节点的节点，则不可以被删除，必填属性
   */
  removed: number;
  /**
   * 当type为'idea'|'group'时提出观点时的结论，可选属性（可能为null或undefined）
   */
  idea_conclusion: string;
  /**
   * 当type为'idea'|'group'时提出观点时的理由，可选属性（可能为null或undefined）
   */
  idea_reason: string;
  /**
   * 当type为'idea'|'group'时提出观点时的限制条件，可选属性（可能为null或undefined）
   */
  idea_limitation: string;
  /**
   * 当type为'disagree'时不同意的点，可选属性（可能为null或undefined）
   */
  disagree_viewpoint: string;
  /**
   * 当type为'disagree'时不同意的原因，可选属性（可能为null或undefined）
   */
  disagree_reason: string;
  /**
   * 当type为'disagree'时不同意时提出的建议，可选属性（可能为null或undefined）
   */
  disagree_suggestion: string;
  /**
   * 当type为'agree'时同意的点，可选属性（可能为null或undefined）
   */
  agree_viewpoint: string;
  /**
   * 当type为'agree'时同意的理由，可选属性（可能为null或undefined）
   */
  agree_reason: string;
  /**
   * 当type为'agree'时同意时给出的补充，可选属性（可能为null或undefined）
   */
  agree_supplement: string;
  /**
   * 当type为'ask'时提问时的问题，可选属性（可能为null或undefined）
   */
  ask_question: string;
  /**
   * 当type为'response'时回应（又称解释）的内容，可选属性（可能为null或undefined）
   */
  response_content: string;
}
// 对应'topic'类型的ViewPoint结构
export interface ViewPoint_Topic
  extends Pick<
    ViewPoint,
    | 'id'
    | 'type'
    | 'topic_id'
    | 'created_time'
    | 'target'
    | 'removed'
    | 'class_id'
  > {}

// 对应'group'类型的ViewPoint结构
export interface ViewPoint_Group
  extends Pick<
    ViewPoint,
    | 'id'
    | 'type'
    | 'topic_id'
    | 'created_time'
    | 'target'
    | 'removed'
    | 'group_id'
  > {}

// 对应'idea'类型的ViewPoint结构
export interface ViewPoint_Idea
  extends Pick<
    ViewPoint,
    | 'id'
    | 'type'
    | 'topic_id'
    | 'created_time'
    | 'target'
    | 'removed'
    | 'student_id'
    | 'idea_conclusion'
    | 'idea_reason'
    | 'idea_limitation'
  > {}

// 对应'agree'类型的ViewPoint结构
export interface ViewPoint_Agree
  extends Pick<
    ViewPoint,
    | 'id'
    | 'type'
    | 'topic_id'
    | 'created_time'
    | 'target'
    | 'removed'
    | 'student_id'
    | 'agree_viewpoint'
    | 'agree_reason'
    | 'agree_supplement'
  > {}

// 对应'disagree'类型的ViewPoint结构
export interface ViewPoint_Disagree
  extends Pick<
    ViewPoint,
    | 'id'
    | 'type'
    | 'topic_id'
    | 'created_time'
    | 'target'
    | 'removed'
    | 'student_id'
    | 'disagree_viewpoint'
    | 'disagree_reason'
    | 'disagree_suggestion'
  > {}

// 对应'ask'类型的ViewPoint结构
export interface ViewPoint_Ask
  extends Pick<
    ViewPoint,
    | 'id'
    | 'type'
    | 'topic_id'
    | 'created_time'
    | 'target'
    | 'removed'
    | 'student_id'
    | 'ask_question'
  > {}

// 对应'response'类型的ViewPoint结构
export interface ViewPoint_Response
  extends Pick<
    ViewPoint,
    | 'id'
    | 'type'
    | 'topic_id'
    | 'created_time'
    | 'target'
    | 'removed'
    | 'student_id'
    | 'response_content'
  > {}

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
  | 'course_work_upload_storage'
  | 'chat_message_storage'
  | 'node_table_revise_logger'
  | 'viewpoint';
