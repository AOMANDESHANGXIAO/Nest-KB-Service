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

interface QueryCollaboration {
  id: number;
  group_id: number;
}
type LegendData = string[];
// interface Indicator {
//   name: string;
//   max: number;
// }
interface SeriesData {
  name: string;
  value: number[];
}
// interface selfAnalysisList {
//   iconName: string;
//   text: string;
//   num: number;
// }
interface LinksData {
  source: string;
  target: string;
  lineStyle: {
    width: number;
  };
}
// interface RelationShipSeriesData {
//   name: string;
// }
export {
  User,
  Login,
  Create,
  QueryCollaboration,
  LegendData,
  SeriesData,
  LinksData,
};
