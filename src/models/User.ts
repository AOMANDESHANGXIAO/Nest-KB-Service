interface User {
  id: number;
  group_id: number;
  class_id: number;
  username: string;
  password: string;
  nickname: string;
}

interface Login {
  username: string;
  password: string;
}

interface Create {
  username: string;
  password: string;
  nickname: string;
  class_id: number;
}

export { User, Login, Create };
