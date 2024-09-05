export interface CreateNewIdeaArgs {
  topic_id: number;
  student_id: number;
  replyType: 'approve' | 'reject'; // 回复类型
  replyNodeId: number; // 回复的Node id
  modifyNodeId: number; // 修改的Node id
  nodes: Array<{
    id: string;
    data: {
      inputValue: string;
      _type: string;
    };
    type: 'element';
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    _type: string;
  }>;
}
