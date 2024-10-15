export interface UploaderInput {
  student_id: string;
  is_public: '0' | '1'; // 表示是否共有,1 表示共有，0表示私有
  topic_id: string;
}
