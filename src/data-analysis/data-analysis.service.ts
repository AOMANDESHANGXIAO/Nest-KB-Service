import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import {
  GetGroupInteraction,
  LinksItem,
  SeriesDataItem,
} from './data-analysis.type';
import {
  GREEN,
  RED,
  PURPLE,
  YELLOW,
  BLUE,
} from 'src/viewpoint/viewpoint.constant';

@Injectable()
export class DataAnalysisService extends SqlService {
  constructor() {
    super();
  }

  async getGroupInteraction(args: GetGroupInteraction): Promise<{
    data: {
      links: LinksItem[];
      SeriesData: SeriesDataItem[];
      notResponsed: {
        id: string;
        name: string;
        type: 'agree' | 'ask' | 'agree' | 'disagree' | 'response' | 'idea';
        color: string;
      }[];
    };
  }> {
    const { topic_id, group_id } = args;
    const sql = `
    SELECT
      vp.id,
      vp.target,
      vp.type,
      vp.student_id AS source,
      s1.nickname AS source_nickname,
      s2.nickname AS target_nickname 
    FROM
      viewpoint vp
      LEFT JOIN viewpoint vp2 ON vp2.id = vp.target
      LEFT JOIN student s1 ON s1.id = vp.student_id
      LEFT JOIN student s2 ON s2.id = vp2.student_id
      LEFT JOIN \`group\` g ON g.id = s1.group_id
      where vp.topic_id = ${topic_id} and s1.group_id = ${group_id}`;
    const list = await this.query<{
      id: number;
      target: number;
      type: 'agree' | 'ask' | 'agree' | 'disagree' | 'response' | 'idea';
      source: number;
      source_nickname: string;
      target_nickname: string;
    }>(sql);
    /**
     * 怎么算宽度呢?
     */
    // const STANDARD_WIDTH = 10;
    const MAX_WIDTH = 50;
    const links: LinksItem[] = [];
    const records = new Map();
    const names = [] as string[];
    const interactList = list.filter((item) => item.type !== 'idea');
    /**
     * 记录每一个节点的宽度
     */
    interactList.forEach((item) => {
      const { source_nickname, target_nickname } = item;
      const [source, target] = [source_nickname, target_nickname].sort();
      const key = `${source}-${target}`;
      /**
       * 记录交互次数
       */
      if (records.has(key)) {
        records.set(key, records.get(key) + 1);
      } else {
        records.set(key, 1);
        /**
         * 没有被记录，那么推送一个进入links
         */
        const newLink: LinksItem = {
          source,
          target,
        };
        links.push(newLink);
      }
      /**
       * 记录人名
       */
      if (!names.includes(source_nickname)) {
        names.push(source_nickname);
      }
      if (!names.includes(target_nickname)) {
        names.push(target_nickname);
      }
    });
    /**
     * 如果小组成员没有交互，那么name不会被统计到
     * 需要补充
     */
    const sqlNames = `
    SELECT
      nickname
    FROM
      student
      JOIN \`group\` g ON g.id = student.group_id
      where g.id = ${group_id}
    `;
    const namesList = await this.query<{ nickname: string }>(sqlNames);
    namesList.forEach((item) => {
      if (!names.includes(item.nickname)) {
        names.push(item.nickname);
      }
    });
    /**
     * 找到所有没有被回复过的观点
     */
    const notResponsed = [];
    const getColor = (
      type: 'agree' | 'ask' | 'agree' | 'disagree' | 'response' | 'idea',
    ) => {
      switch (type) {
        case 'agree':
          return GREEN;
        case 'ask':
          return YELLOW;
        case 'disagree':
          return RED;
        case 'response':
          return PURPLE;
        case 'idea':
          return BLUE;
      }
    };
    list.forEach((item) => {
      const element = list.find((el) => {
        return String(el.target) === String(item.id);
      });
      if (!element) {
        notResponsed.push({
          id: String(item.id),
          name: item.source_nickname,
          type: item.type,
          color: getColor(item.type),
        });
      }
    });
    const getWidth = (source_: string, target_: string) => {
      const [source, target] = [source_, target_].sort();
      const key = `${source}-${target}`;
      return (records.get(key) * 5) % MAX_WIDTH;
    };

    return {
      data: {
        links: links.map((item) => {
          return {
            ...item,
            lineStyle: {
              width: getWidth(String(item.source), String(item.target)),
            },
          };
        }),
        SeriesData: names.map((item) => {
          return {
            name: item,
          };
        }),
        notResponsed,
      },
    };
  }
}
