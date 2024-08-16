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

export { User, Login };
