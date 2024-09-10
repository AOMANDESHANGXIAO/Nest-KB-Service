import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
// import GroupCRUDer from 'src/crud/Group';
import NodeCRUDer from 'src/crud/NodeTable';
import EdgeCRUDer from 'src/crud/EdgeTable';
import ArguNodeCruder from 'src/crud/ArguNode';
import ArguEdgeCruder from 'src/crud/ArguEdge';
import { IdeaType, TopicType, GroupType } from 'src/crud/NodeTable.type';
import { NodeTable, NodeTypeEnum } from 'src/crud/Table.model';
import { EdgeTable, ArguNodeTable, ArguEdgeTable } from 'src/crud/Table.model';
import {
  CreateNewIdeaArgs,
  CreateNewGroupIdeaArgs,
} from '../flow/Models/index';
import { IndividualRadarData } from './Models';

/**
 * TODO: 实现发布小组观点功能API✅
 */
@Injectable()
export class FlowService extends SqlService {
  nodeCruder: NodeCRUDer;
  edgeCruder: EdgeCRUDer;
  arguNodeCruder: ArguNodeCruder;
  arguEdgeCruder: ArguEdgeCruder;
  // groupCruder: GroupCRUDer;
  constructor() {
    super();
    this.nodeCruder = new NodeCRUDer(this);
    this.edgeCruder = new EdgeCRUDer(this);
    this.arguNodeCruder = new ArguNodeCruder(this);
    this.arguEdgeCruder = new ArguEdgeCruder(this);
    // this.groupCruder = new GroupCRUDer(this);
  }

  public async queryFlow(topic_id: number) {
    const [ideas, topics, groups, edges]: [
      IdeaType[],
      TopicType[],
      GroupType[],
      Pick<EdgeTable, 'source' | 'target' | 'type' | 'id'>[],
    ] = await Promise.all([
      this.nodeCruder.selectOneTypeByTopicId({
        topic_id,
        type: NodeTypeEnum.idea,
      }),
      this.nodeCruder.selectOneTypeByTopicId({
        topic_id,
        type: NodeTypeEnum.topic,
      }),
      this.nodeCruder.selectOneTypeByTopicId({
        topic_id,
        type: NodeTypeEnum.group,
      }),
      this.edgeCruder.selectAllByTopicId(topic_id),
    ]);

    return {
      data: {
        nodes: [
          ...ideas.map((idea) => ({
            id: String(idea.node_id),
            type: NodeTypeEnum.idea,
            data: {
              name: idea.nickname,
              id: idea.node_id,
              bgc: idea.group_color,
              student_id: idea.student_id,
            },
            position: {
              x: 0,
              y: 0,
            },
          })),
          ...groups.map((item) => ({
            id: String(item.node_id),
            type: NodeTypeEnum.group,
            data: {
              groupName: item.group_name,
              groupConclusion: item.content || '',
              bgc: item.group_color,
              group_id: item.group_id,
              node_id: String(item.node_id), // 新增一个字段，用于传递小组节点的Node_id
            },
            positon: {
              x: 0,
              y: 0,
            },
          })),
          ...topics.map((item) => ({
            id: String(item.id),
            type: NodeTypeEnum.topic,
            data: {
              text: item.content,
            },
            position: {
              x: 0,
              y: 0,
            },
          })),
        ],
        edges: edges.map((item) => ({
          id: String(item.id),
          source: String(item.source),
          target: String(item.target),
          _type: item.type,
          animated: false,
        })),
      },
    };
  }

  public async queryNodeContentById(node_id: number) {
    const lastestVersion = await this.arguNodeCruder.FindLatestVersion(node_id);
    if (!lastestVersion) {
      return this.failResponse('没有找到该论证节点');
    }
    const [arguNodes, arguEdges] = await Promise.all([
      this.query<
        Pick<
          ArguNodeTable,
          'id' | 'type' | 'content' | 'arguKey' | 'version' | 'arguId'
        >
      >(
        this.generateSelectSql<ArguNodeTable>(
          'argunode',
          ['id', 'type', 'content', 'arguKey', 'version', 'arguId'],
          [
            { field: 'arguKey', value: node_id },
            { field: 'version', value: lastestVersion },
          ],
        ),
      ),
      this.query<ArguEdgeTable>(
        this.generateSelectSql<ArguEdgeTable>(
          'arguedge',
          ['id', 'type', 'source', 'target', 'version', 'arguId', 'arguKey'],
          [
            { field: 'arguKey', value: node_id },
            { field: 'version', value: lastestVersion },
          ],
        ),
      ),
    ]);

    return {
      data: {
        nodes: arguNodes.map((item) => ({
          id: item.arguId,
          data: { inputValue: item.content, _type: item.type },
          type: 'element',
          position: {
            x: 0,
            y: 0,
          },
        })),
        edges: arguEdges.map((item) => ({
          id: item.arguId,
          source: item.source,
          target: item.target,
          _type: item.type,
        })),
      },
    };
  }

  public async createNewIdea(
    args: CreateNewIdeaArgs,
    type?: 'idea' | 'reply' | 'modify',
  ) {
    const { topic_id, student_id, nodes, edges } = args;

    const createdEffect: Array<() => Promise<any>> = [];

    let arguKey: string;
    let version: number = 1;

    if (type === 'idea') {
      const callback = async () => {
        // 如果是提出观点,那么会自动连接到小组
        return this.conncetIdeaToGroup(+arguKey, student_id, topic_id);
      };
      createdEffect.push(callback);
    } else if (type === 'reply') {
      const { replyNodeId, replyType } = args;
      // 如果是回复观点那么要将创建的观点连接到被回复的观点
      const callback = async () => {
        return this.insert(
          this.generateInsertSql(
            'edge_table',
            ['source', 'target', 'topic_id', 'type'],
            [[arguKey, replyNodeId, topic_id, replyType]],
          ),
        );
      };
      createdEffect.push(callback);
    } else if (type === 'modify') {
      const { modifyNodeId } = args;
      version =
        (await this.arguNodeCruder.FindLatestVersion(+modifyNodeId)) + 1;
    }

    await this.transaction(async () => {
      // 创建数据插入NodeTable
      if (type !== 'modify') {
        arguKey = await this.insert(
          this.generateInsertSql<NodeTable>(
            'node_table',
            ['topic_id', 'type', 'student_id', 'created_time', 'version'],
            [[topic_id, NodeTypeEnum.idea, student_id, 'NOW', version]],
          ),
        );
      } else {
        // 修改时则依据传递过来的nodeId创建，arguKey
        const { modifyNodeId } = args;
        arguKey = String(modifyNodeId);
        const res = await this.arguNodeCruder.queryByArguKey(+modifyNodeId);
        if (res.length === 0) {
          return this.failResponse('没有找到该论证节点');
        }

        // 判断arguKey是否存在
      }

      // 创建数据插入ArguNodeTable,ArguEdgeTable
      await Promise.all([
        this.insert(
          this.generateInsertSql<ArguNodeTable>(
            'argunode',
            ['type', 'content', 'arguKey', 'version', 'arguId', 'creator'],
            nodes.map((item) => [
              item.data._type,
              item.data.inputValue,
              arguKey,
              version,
              item.id,
              student_id,
            ]),
          ),
        ),
        this.insert(
          this.generateInsertSql<ArguEdgeTable>(
            'arguedge',
            ['type', 'source', 'target', 'arguKey', 'version', 'arguId'],
            edges.map((item) => [
              item._type,
              item.source,
              item.target,
              arguKey,
              version,
              item.id,
            ]),
          ),
        ),
      ]);
      // 调用创建以后的影响
      // console.log('createdEffect', createdEffect);
      // 依次调用
      await Promise.all(
        createdEffect.map((item) => item().catch((err) => console.log(err))),
      );
    });

    return {
      data: {},
      message: 'create success',
    };
  }

  private async conncetIdeaToGroup(
    arguKey: number,
    student_id: number,
    topic_id: number,
  ) {
    const { id: groupId } = await this.nodeCruder.findGroupByTopicIdStudentId(
      topic_id,
      student_id,
    );

    return this.insert(
      this.generateInsertSql<EdgeTable>(
        'edge_table',
        ['source', 'target', 'type', 'topic_id'],
        [[arguKey, groupId, 'idea_to_group', topic_id]],
      ),
    );
  }

  /**
   *  依据Node的id查询小组节点的论证
   */
  public async queryGroupNodeContentByNodeId(node_id: string) {
    // TODO: 规范，还要查询引用状态等，因此单独啦一个方法出来
    return await this.queryNodeContentById(+node_id);
  }

  public async createGroupConclusion(args: CreateNewGroupIdeaArgs) {
    const { nodes, edges, groupNodeId, student_id } = args;
    const arguKey = args.groupNodeId;
    const createdEffects: Array<() => Promise<any>> = [];

    const version =
      (await this.arguNodeCruder.FindLatestVersion(+groupNodeId)) + 1;

    await this.transaction(async () => {
      // 创建argumentNode和argumentEdge
      await Promise.all([
        this.insert(
          this.generateInsertSql<ArguNodeTable>(
            'argunode',
            ['type', 'content', 'arguKey', 'version', 'arguId', 'creator'],
            nodes.map((item) => [
              item.data._type,
              item.data.inputValue,
              arguKey,
              version,
              item.id,
              student_id,
            ]),
          ),
        ),
        this.insert(
          this.generateInsertSql<ArguEdgeTable>(
            'arguedge',
            ['type', 'source', 'target', 'arguKey', 'version', 'arguId'],
            edges.map((item) => [
              item._type,
              item.source,
              item.target,
              arguKey,
              version,
              item.id,
            ]),
          ),
        ),
      ]);

      // 创建后的影响
      await Promise.all(
        createdEffects.map((item) => item().catch((err) => console.log(err))),
      );
    });

    return {
      data: {},
    };
  }

  public async modifyGroupConslusion(args: CreateNewGroupIdeaArgs) {
    return await this.createGroupConclusion(args);
  }

  /**
   *
   * @returns 格式化工具函数
   */
  // FIXME: 前端渲染不出来
  public formatter() {
    const individualRadarFormatter = (
      data: Array<{ type: string; count: number }>,
    ): IndividualRadarData => {
      const max = Math.max(...data.map((item) => item.count));
      const nameTypeMap = {
        data: '前提',
        claim: '结论',
        warrant: '辩护',
        backing: '支撑',
        qualifier: '限定词',
        rebuttal: '反驳',
      };
      const indicator = data.map((item) => ({
        name: nameTypeMap[item.type],
        max,
      }));
      const series = {
        name: '个人论证情况',
        type: 'radar',
        data: [
          {
            value: data.map((item) => item.count),
            name: '个人论证情况',
          },
        ],
      };
      return {
        title: {
          text: '个人论证情况',
        },
        legend: {
          data: ['个人论证情况'],
        },
        radar: {
          indicator: indicator,
        },
        series,
      };
    };
    return {
      individualRadarFormatter,
    };
  }

  public async queryDashboard(topic_id: number, student_id: number) {
    const [individualArgument] = await Promise.all([
      this.queryIndividualArgument(topic_id, student_id),
    ]);

    const { individualRadarFormatter } = this.formatter();
    return {
      data: {
        radarOption: individualRadarFormatter(individualArgument),
      },
    };
  }

  /**
   *
   * @param topic_id
   * @param student_id
   * @description 依据主题和学生的id查询个人的论证情况
   */
  private async queryIndividualArgument(topic_id: number, student_id: number) {
    const sql = `
    SELECT 
        a.type,
        COUNT(*) AS count
    FROM 
        argunode a
    JOIN 
        node_table n ON a.arguKey = n.id
    WHERE 
        n.topic_id = ${topic_id}
    AND 
        n.student_id = ${student_id}
    GROUP BY 
        a.type;`;
    const res = await this.query<{ type: string; count: number }>(sql);
    return res;
  }
}
