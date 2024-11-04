export interface UploadInput {
  student_id: number;
  is_public: number;
  topic_id: number;
}
export interface UploadFileInfo {
  fileName: string;
  filePath: string;
}
export interface UploadCourseWorkInput {
  student_id: number;
  topic_id: number;
}
