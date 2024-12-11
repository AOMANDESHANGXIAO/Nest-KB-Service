export interface GetGroupInteraction {
  topic_id: number;
  group_id: number;
}
/**
 * 关系图需要返回的数据格式
 */
export interface LinksItem {
  source: number | string;
  target: number | string;
  symbolSize?: number[];
  label?: {
    show: boolean;
  };
  lineStyle?: {
    width: number;
  };
}
/**
 * 关系图返回的数据格式
 */
export interface SeriesDataItem {
  name: string;
}
