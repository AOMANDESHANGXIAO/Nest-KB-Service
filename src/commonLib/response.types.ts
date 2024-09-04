interface Response<T> {
  code: number;
  success: boolean;
  message: string;
  data: T;
}

type PickData<T extends { data: any }> = Pick<T, 'data'>;

// discuss
type QueryTopicResponse = Response<{
  list: Array<{
    id: number;
    topic_content: string;
    created_time: Date;
    nickname: string;
  }>;
}>;

// classroom
type QueryClassRoomListResponse = Response<{
  list: Array<{
    id: number;
    class_name: string;
  }>;
}>;

export { Response, PickData, QueryTopicResponse, QueryClassRoomListResponse };
