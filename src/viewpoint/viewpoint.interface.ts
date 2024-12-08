export interface CreateTopicArgs {
  content: string;
  creator_id: number;
  class_id: number;
  status: string;
}
export interface CreateIdeaArgs {
  topic_id: number;
  student_id: number;
  idea_conclusion: string;
  idea_reason: string;
  idea_limitation: string;
}
export interface CreateAgreeArgs {
  topic_id: number;
  student_id: number;
  target: number;
  agree_viewpoint: string;
  agree_reason: string;
  agree_supplement: string;
}
export interface CreateDisAgreeArgs {
  topic_id: number;
  student_id: number;
  target: number;
  disagree_viewpoint: string;
  disagree_reason: string;
  disagree_suggestion: string;
}
export interface CreateAskArgs {
  topic_id: number;
  student_id: number;
  target: number;
  ask_question: string;
}
export interface CreateResponseArgs {
  topic_id: number;
  student_id: number;
  target: number;
  response_content: string;
}
export interface GetTopicArgs {
  topic_id: number;
}
export interface GetIdeaArgs {
  id: number;
  student_id: number;
}
