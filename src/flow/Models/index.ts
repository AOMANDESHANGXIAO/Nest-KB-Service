export interface CreateNewIdeaArgs {
  topic_id: number;
  student_id: number;
  replyType: 'approve' | 'reject' | 'response'; // 回复类型,分别为同意观点-拒绝观点-响应问题
  replyNodeId: number; // 回复的Node id
  modifyNodeId: number; // 修改的Node id
  nodes: Array<{
    id: string;
    data: {
      inputValue: string;
      _type:
        | 'backing'
        | 'warrant'
        | 'claim'
        | 'qualifier'
        | 'rebuttal'
        | 'data'; // 类型,
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

export interface CreateNewGroupIdeaArgs
  extends Omit<
    CreateNewIdeaArgs,
    'replyType' & 'replyNodeId' & 'modifyNodeId'
  > {
  groupNodeId: string; // 小组的Node id
}

export interface ResponseQuestionArgs extends CreateNewIdeaArgs {
  // 提交问题
  questionNodeId: string; // 问题的Node id
}

export interface IndividualRadarData {
  radar: {
    indicator: Array<{ name: string; max: number }>;
  };
  legend?: { data: Array<string> };
  title: {
    text: string;
  };
  series: {
    name: string;
    type: string;
    data: Array<{
      value: Array<number>;
      name: string;
    }>;
  };
}

export interface CreateQuestionIdeaArgs {
  topic_id: number;
  reply_node_id: number; // node_id
  question_content: string;
  student_id: number; // 创建者的id
}
