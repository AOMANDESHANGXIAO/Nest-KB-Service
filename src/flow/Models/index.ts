export interface CreateNewIdeaArgs {
  topic_id: number;
  student_id: number;
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
