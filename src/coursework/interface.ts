export interface AddCourseWorkInput {
  topic_id: number;
  content: string;
}

export interface GetCourseWorkInput {
  topic_id: number;
}
export interface GetCourseWorkInputUploaded {
  topic_id: number;
  student_id: number;
}
