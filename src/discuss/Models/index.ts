import { DiscussAction } from 'src/crud/Table.model';
export interface FindAllQueryInput {
  class_id: number;
  content?: string;
  sort?: 1 | 0;
}
type CreateDiscussionInput = {
  topic_content: string;
  created_user_id: number;
  topic_for_class_id: number;
};
type UpdateDiscussion = {
  topicId: number;
  status: DiscussAction['action'];
  operatorId: number;
};
type QueryRate = {
  topicId: number;
  groupId?: number;
  ideaType?: 'idea' | 'group';
  publisherId?: number;
};
type UpdateRateInput = {
  recognition: number;
  understanding: number;
  evaluation: number;
  analysis: number;
  create: number;
  node_table_id: number;
  version: number;
};
export type {
  CreateDiscussionInput,
  UpdateDiscussion,
  QueryRate,
  UpdateRateInput,
};
