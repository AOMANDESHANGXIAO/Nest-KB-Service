interface User {
  id: number;
  group_id: number;
  class_id: number;
  username: string;
  password: string;
  nickname: string;
}

interface UserUpdateDto {
  id: number;
  group_id?: number;
  class_id?: number;
  username?: string;
  password?: string;
  nickname?: string;
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

interface QueryCollaboration {
  id: number;
  group_id: number;
}

type LegendData = string[];

interface SeriesData {
  name: string;
  value: number[];
}

interface LinksData {
  source: string;
  target: string;
  lineStyle: {
    width: number;
  };
}

export {
  User,
  UserUpdateDto,
  Login,
  Create,
  QueryCollaboration,
  LegendData,
  SeriesData,
  LinksData,
};
