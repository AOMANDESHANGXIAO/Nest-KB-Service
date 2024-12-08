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
  agree_viewpoint: string;
  agree_reason: string;
  agree_supplement: string;
  target: number;
}
