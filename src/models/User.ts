interface User {
  id: number;
  group_id: number;
  class_id: number;
  username: string;
  password: string;
}

interface Login {
  username: string;
  password: string;
}

export { User, Login };
