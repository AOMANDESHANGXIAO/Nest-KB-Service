type IdeaType = {
  node_id: number;
  content: string;
  nickname: string;
  group_color: string;
  student_id: number;
};

type TopicType = {
  id: number;
  content: string;
};

type GroupType = {
  node_id: number;
  content: string;
  group_name: string;
  group_color: string;
  group_id: number;
};

type QuestionType = {
  node_id: number;
  content: string;
  nickname: string;
  group_color: string;
  student_id: number;
};

export { IdeaType, TopicType, GroupType, QuestionType };
