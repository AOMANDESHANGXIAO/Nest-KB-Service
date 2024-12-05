import { HttpException, Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
// import GroupCRUDer from 'src/crud/Group';
import NodeCRUDer from 'src/crud/NodeTable';
import EdgeCRUDer from 'src/crud/EdgeTable';
import ArguNodeCruder from 'src/crud/ArguNode';
import ArguEdgeCruder from 'src/crud/ArguEdge';
import {
  IdeaType,
  TopicType,
  GroupType,
  QuestionType,
} from 'src/crud/NodeTable.type';
import {
  NodeTable,
  NodeTypeEnum,
  StudentActionLog,
} from 'src/crud/Table.model';
import {
  EdgeTable,
  ArguNodeTable,
  ArguEdgeTable,
  DiscussAction,
} from 'src/crud/Table.model';
import {
  CreateNewIdeaArgs,
  CreateNewGroupIdeaArgs,
  CreateQuestionIdeaArgs,
  ResponseQuestionArgs,
} from '../flow/Models/index';
import { IndividualRadarData } from './Models';
import * as _ from 'lodash';
import { escapeSqlString } from 'src/utils/escapeString';
import { getFormatterContent } from './flow.utils';
import { logNodeRevise } from './flow.logger';

@Injectable()
export class FlowService extends SqlService {
  nodeCruder: NodeCRUDer;
  edgeCruder: EdgeCRUDer;
  arguNodeCruder: ArguNodeCruder;
  arguEdgeCruder: ArguEdgeCruder;
  constructor() {
    super();
    this.nodeCruder = new NodeCRUDer(this);
    this.edgeCruder = new EdgeCRUDer(this);
    this.arguNodeCruder = new ArguNodeCruder(this);
    this.arguEdgeCruder = new ArguEdgeCruder(this);
  }

  public async queryFlow({
    topic_id,
    student_id,
  }: {
    topic_id: number;
    student_id: number;
  }) {
    const [ideas, topics, groups, edges, questions]: [
      IdeaType[],
      TopicType[],
      GroupType[],
      Pick<EdgeTable, 'source' | 'target' | 'type' | 'id'>[],
      QuestionType[],
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
      this.nodeCruder.selectOneTypeByTopicId({
        topic_id,
        type: NodeTypeEnum.question,
      }),
    ]);
    /**
     * TODO: 查询出所有回复student_id的节点
     */
    const sqlAllResponse = `
    SELECT
      s1.nickname AS 'sourceNodeStudent',
      s2.nickname AS 'targetNodeStudent',
      n1.content AS 'sourceNodeContent',
      s1.id AS 'sourceStudentId',
      s2.id AS 'targetStudentId',
      e.source,
      e.target,
      e.type 
    FROM
      edge_table e
      JOIN node_table n1 ON n1.id = e.source
      JOIN node_table n2 ON n2.id = e.target
      JOIN student s1 ON s1.id = n1.student_id
      JOIN student s2 ON s2.id = n2.student_id 
    WHERE
      e.type != 'idea_to_group' 
      AND e.type != 'group_to_discuss' 
      AND (s2.id = ${student_id} OR s1.id = ${student_id})
      AND (S2.id != s1.id)
      AND e.topic_id = ${topic_id};`;
    const allResponse = await this.query<{
      sourceNodeStudent: string;
      targetNodeStudent: string;
      sourceNodeContent: string;
      sourceStudentId: number;
      targetStudentId: number;
      source: string;
      target: string;
      type: string;
    }>(sqlAllResponse);
    /**
     * 找到学生回复的节点
     */
    const studentHasResponsedIds = allResponse
      .filter((item) => String(item.sourceStudentId) === String(student_id))
      .map((item) => String(item.target));
    console.log('studentHasResponsedIds', studentHasResponsedIds);
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
          ...questions.map((item) => ({
            id: String(item.node_id),
            type: NodeTypeEnum.question,
            data: {
              name: item.nickname,
              id: item.node_id,
              bgc: item.group_color,
              student_id: item.student_id,
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
        related: allResponse
          .filter(
            // 首先过滤掉自己的回复
            (item) => String(item.sourceStudentId) !== String(student_id),
          )
          .map((item) => {
            return {
              ...item,
              sourceStudentId: String(item.sourceStudentId),
              targetStudentId: String(item.targetStudentId),
              source: String(item.source),
              target: String(item.target),
              responsed: studentHasResponsedIds.includes(String(item.source)),
            };
          }),
      },
    };
  }

  public async queryNodeContentById(
    node_id: number,
    student_id: number,
    type: 'idea' | 'group',
  ) {
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

    // 由管理员进行的查询，则不进行记录
    if (student_id) {
      await this.log({
        action: `check_${type}`,
        student_id: student_id,
        node_id: node_id,
      });
    }

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

  public async queryQuestionNodeContentById({
    node_id,
    student_id,
  }: {
    node_id: number;
    student_id: number;
  }) {
    // 查询内容
    const sql = `
    SELECT
      nt.content,
      st.nickname 
    FROM
      node_table nt
      JOIN student st ON st.id = nt.student_id 
    WHERE
      nt.id = ${node_id};`;

    const [res] = await this.query<{ content: string; nickname: string }>(sql);
    await this.log({
      action: 'check_question',
      student_id: student_id,
      node_id: node_id,
    });
    return {
      data: {
        content: res.content,
        nickname: res.nickname,
      },
    };
  }

  public async createQuestionIdea(args: CreateQuestionIdeaArgs) {
    const { question_content, reply_node_id, student_id, topic_id } = args;
    // 插入一个QuestionNode
    await this.transaction(async () => {
      const insertId = await this.insert(
        // 插入NodeTable
        this.generateInsertSql<NodeTable>(
          'node_table',
          [
            'type',
            'content',
            'student_id',
            'topic_id',
            'created_time',
            'version',
          ],
          [
            [
              NodeTypeEnum.question,
              question_content,
              student_id,
              topic_id,
              'NOW',
              1,
            ],
          ],
        ),
      );
      await this.insert(
        this.generateInsertSql<EdgeTable>(
          'edge_table',
          ['source', 'target', 'type', 'topic_id'],
          [[insertId, reply_node_id, 'question_to_idea', topic_id]],
        ),
      );
      // logger
      await this.log({
        action: 'question',
        student_id: student_id,
        node_id: Number(insertId),
      });
    });
    return {
      data: {},
      message: 'OK',
    };
  }

  public async createNewIdea(
    args: CreateNewIdeaArgs,
    type?: 'idea' | 'reply' | 'modify',
  ) {
    const { topic_id, student_id, nodes, edges, modifyNodeId } = args;

    const createdEffect: Array<() => Promise<any>> = [];

    let arguKey: string;
    let version: number = 1;

    // 创建后的影响
    if (type === 'idea') {
      const callback = async () => {
        // 记录用户操作
        await this.log({
          action: 'propose',
          student_id: student_id,
          node_id: +arguKey,
        });
        // 记录修改
        await logNodeRevise(this, {
          node_id: +arguKey,
          student_id: student_id,
          content: escapeSqlString(getFormatterContent(nodes)),
          version: version,
        });
        // 如果是提出观点,那么会自动连接到小组
        return this.conncetIdeaToGroup(+arguKey, student_id, topic_id);
      };
      createdEffect.push(callback);
    } else if (type === 'reply') {
      const { replyNodeId, replyType, student_id } = args;

      // 如果是回复观点那么要将创建的观点连接到被回复的观点
      const callback = async () => {
        // log 回复观点
        const actionMap: Record<string, StudentActionLog['action']> = {
          approve: 'approve',
          reject: 'oppose',
          response: 'response_question',
        };
        await this.log({
          action: actionMap[replyType],
          student_id: student_id,
          node_id: +replyNodeId,
        });
        // 记录修改
        await logNodeRevise(this, {
          node_id: +replyNodeId,
          student_id: student_id,
          content: escapeSqlString(getFormatterContent(nodes)),
          version: version,
        });
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
      const { student_id } = args;
      version =
        (await this.arguNodeCruder.FindLatestVersion(+modifyNodeId)) + 1;
      // 修改时则依据传递过来的nodeId创建，arguKey
      // 修改时需要更新content和version
      const updateSql = `
        UPDATE node_table 
        SET content = '${escapeSqlString(getFormatterContent(nodes))}',
            version = ${version}
        WHERE id = ${modifyNodeId};
        `;
      await this.update(updateSql);
      await logNodeRevise(this, {
        node_id: +modifyNodeId,
        student_id: student_id,
        content: escapeSqlString(getFormatterContent(nodes)),
        version: version,
      });

      const callback = async () => {
        await this.log({
          action: 'modify_idea',
          student_id: student_id,
          node_id: +modifyNodeId,
        });
      };
      createdEffect.push(callback);
    }

    await this.transaction(async () => {
      // 创建数据插入NodeTable
      if (type !== 'modify') {
        arguKey = await this.insert(
          this.generateInsertSql<NodeTable>(
            'node_table',
            [
              'topic_id',
              'type',
              'student_id',
              'created_time',
              'version',
              'content',
            ],
            [
              [
                topic_id,
                NodeTypeEnum.idea,
                student_id,
                'NOW',
                version,
                escapeSqlString(getFormatterContent(nodes)),
              ],
            ],
          ),
        );
      } else {
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
      await Promise.all(
        createdEffect.map((item) => item().catch((err) => console.log(err))),
      );
    });

    return {
      data: {},
      message: 'create success',
    };
  }

  public async responseQuestion(args: ResponseQuestionArgs) {
    const { nodes, edges, student_id, questionNodeId, topic_id } = args;
    const version = 1;
    await this.transaction(async () => {
      // 1. 在NodeTable(观点)上创建一个节点
      const source = await this.insert(
        this.generateInsertSql<NodeTable>(
          'node_table',
          [
            'topic_id',
            'type',
            'student_id',
            'created_time',
            'version',
            'content',
          ],
          [
            [
              topic_id,
              NodeTypeEnum.idea,
              student_id,
              'NOW',
              version,
              escapeSqlString(getFormatterContent(nodes)),
            ],
          ],
        ),
      );
      // 2. 在EdgeTable(观点)上创建一条边
      const coulmnValues = [
        source,
        questionNodeId,
        topic_id,
        'response_to_question',
      ];
      await this.insert(
        this.generateInsertSql<EdgeTable>(
          'edge_table',
          ['source', 'target', 'topic_id', 'type'],
          [coulmnValues],
        ),
      );
      // 3. 更新ArgumentNode节点
      // 创建数据插入ArguNodeTable,ArguEdgeTable
      await Promise.all([
        this.insert(
          this.generateInsertSql<ArguNodeTable>(
            'argunode',
            ['type', 'content', 'arguKey', 'version', 'arguId', 'creator'],
            nodes.map((item) => [
              item.data._type,
              item.data.inputValue,
              source,
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
              source,
              version,
              item.id,
            ]),
          ),
        ),
      ]);

      // 4. logger记录回复question
      await this.log({
        action: 'response_question',
        student_id: student_id,
        node_id: Number(source),
      });
    });
    return {
      data: {},
      message: 'OK',
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
  public async queryGroupNodeContentByNodeId(
    node_id: string,
    student_id: number,
  ) {
    return await this.queryNodeContentById(+node_id, student_id, 'group');
  }

  public async createGroupConclusion(
    args: CreateNewGroupIdeaArgs,
    type: 'summary' | 'modify' = 'summary',
  ) {
    const { nodes, edges, groupNodeId, student_id } = args;
    // 检验
    if (
      nodes.length === 0 ||
      edges.length === 0 ||
      !groupNodeId ||
      !student_id
    ) {
      throw new HttpException('参数错误', 500);
    }
    const arguKey = args.groupNodeId;
    const createdEffects: Array<() => Promise<any>> = [];

    const version =
      (await this.arguNodeCruder.FindLatestVersion(+groupNodeId)) + 1;
    const callback = async () => {
      await this.log({
        action: type === 'summary' ? 'summary_group' : 'modify_group',
        student_id: student_id,
        node_id: +groupNodeId,
      });
      // Update group node content
      await this.update(
        `UPDATE node_table SET content = '${escapeSqlString(
          getFormatterContent(nodes),
        )}', version = ${version} WHERE id = ${groupNodeId};`,
      );
      // 记录修改
      await logNodeRevise(this, {
        node_id: +groupNodeId,
        student_id: student_id,
        content: escapeSqlString(getFormatterContent(nodes)),
        version: version,
      });
    };
    createdEffects.push(callback);

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
    return await this.createGroupConclusion(args, 'modify');
  }

  public async queryTopicProcess(topic_id: number) {
    const sql = `
    SELECT
      da.id,
      da.action,
      da.discuss_id,
      da.created_time 
    FROM
      \`discuss_action\` da 
    WHERE
      da.discuss_id = ${topic_id}
    `;
    return await this.query<Omit<DiscussAction, 'operator_id'>>(sql);
  }
  /**
   *
   * @returns 格式化工具函数
   */
  public formatter() {
    const individualRadarFormatter = (
      data: Array<{ type: string; count: number }>,
    ): IndividualRadarData => {
      const nameTypeMap = {
        data: '前提',
        claim: '结论',
        warrant: '辩护',
        backing: '支撑',
        qualifier: '限定词',
        rebuttal: '反驳',
      };
      Object.keys(nameTypeMap).forEach((key) => {
        if (!data.find((item) => item.type === key)) {
          data.push({ type: key, count: 0 });
        }
      });
      const max = Math.max(...data.map((item) => item.count));
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
        radar: {
          indicator: indicator,
        },
        series,
      };
    };

    const peerInteractionFormatter = (
      data: {
        id: number;
        type: string;
        source: string;
        source_student_id: number;
        source_group_id: number;
        source_nickname: string;
        target: string;
        target_student_id: number;
        target_group_id: number;
        target_nickname: string;
      }[],
      nicknames: { nickname: string }[],
    ) => {
      const MAX_LINE_STYLE_WIDTH = 20;

      const dataOfSeries = nicknames.map((name) => ({
        name: name.nickname,
      }));

      const sourceTargetMap = {
        // 记录reject和approve的出现次数
        reject: new Map<string, number>(),
        approve: new Map<string, number>(),
      };

      data.forEach((item) => {
        const key = `${item.source_nickname}-${item.target_nickname}`;
        if (item.type === 'reject') {
          sourceTargetMap.reject.set(
            key,
            (sourceTargetMap.reject.get(key) || 0) + 1,
          );
        } else {
          sourceTargetMap.approve.set(
            key,
            (sourceTargetMap.approve.get(key) || 0) + 1,
          );
        }
      });

      const linksOfSerious: {
        source: string;
        target: string;
        lineStyle?: { width: number };
      }[] = [];

      // 根据nicknames生成初始links,nickname两两连接
      for (let i = 0; i < nicknames.length; i++) {
        for (let j = i + 1; j < nicknames.length; j++) {
          linksOfSerious.push({
            source: nicknames[i].nickname,
            target: nicknames[j].nickname,
          });
        }
      }
      // 拿到approve和reject相加的最大数,注意是相加

      const maxLinks = linksOfSerious.map((item) => {
        const key = `${item.source}-${item.target}`;
        const reverseKey = `${item.target}-${item.source}`;
        const total =
          (sourceTargetMap.approve.get(key) || 0) +
          (sourceTargetMap.reject.get(key) || 0) +
          (sourceTargetMap.approve.get(reverseKey) || 0) +
          (sourceTargetMap.reject.get(reverseKey) || 0);
        return total;
      });

      let maxInteractCount = 0;

      maxLinks.forEach((item) => {
        maxInteractCount = Math.max(maxInteractCount, item);
      });
      // 根据approve和reject的连接强度设置lineStyle的width
      linksOfSerious.forEach((item) => {
        const key = `${item.source}-${item.target}`;
        const reverseKey = `${item.target}-${item.source}`;
        const approveCount =
          (sourceTargetMap.approve.get(key) || 0) +
          (sourceTargetMap.approve.get(reverseKey) || 0);
        const rejectCount =
          (sourceTargetMap.reject.get(key) || 0) +
          (sourceTargetMap.reject.get(reverseKey) || 0);
        const computedWidth =
          ((approveCount + rejectCount) / maxInteractCount) *
          MAX_LINE_STYLE_WIDTH;
        item.lineStyle = {
          width: computedWidth || 0,
        };
      });

      return {
        title: {
          text: '小组互动图',
        },
        tooltip: {},
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        series: [
          {
            type: 'graph',
            layout: 'circular',
            symbolSize: 50,
            roam: true,
            label: {
              show: true,
            },
            edgeSymbol: ['none', 'none'],
            edgeSymbolSize: [4, 10],
            edgeLabel: {
              fontSize: 20,
            },
            data: dataOfSeries,
            links: linksOfSerious,
            lineStyle: {
              opacity: 0.9,
              curveness: 0,
            },
          },
        ],
      };
    };

    const replyAndModifyFormatter = (
      data: {
        replyCount: {
          nickname: string;
          proposeNum: number;
          rejectNum: number;
          approveNum: number;
        }[];
        modifyCount: {
          student_id: number;
          nickname: string;
          total_modify_count: string;
        }[];
      },
      nicknames: { nickname: string }[],
    ) => {
      const { replyCount, modifyCount } = data;
      const createMap = (arr: { nickname: string }[], key: string) => {
        const map = new Map();
        arr.forEach((item) => {
          map.set(item.nickname, item[key]);
        });
        return map;
      };
      const [proposeMap, rejectMap, approveMap, modifyMap] = [
        createMap(replyCount, 'proposeNum'),
        createMap(replyCount, 'rejectNum'),
        createMap(replyCount, 'approveNum'),
        createMap(modifyCount, 'total_modify_count'),
      ];
      // console.log(proposeMap, rejectMap, approveMap, modifyMap);
      // console.log()
      const getCount = (m: Map<string, string | number>, nickname: string) => {
        return Number(m.get(nickname)) || 0;
      };

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // Use axis to trigger tooltip
            type: 'shadow', // 'shadow' as default; can also be 'line' or 'shadow'
          },
        },
        legend: {},
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: ['提出', '修改', '支持', '反对'],
        },
        yAxis: {
          type: 'value',
        },
        series: nicknames.map((item) => {
          return {
            name: item.nickname,
            type: 'bar',
            stack: 'total',
            label: {
              show: true,
            },
            emphasis: {
              focus: 'series',
            },
            data: [
              getCount(proposeMap, item.nickname),
              getCount(modifyMap, item.nickname),
              getCount(approveMap, item.nickname),
              getCount(rejectMap, item.nickname),
            ],
          };
        }),
      };
    };

    return {
      individualRadarFormatter,
      peerInteractionFormatter,
      replyAndModifyFormatter,
    };
  }

  /**
   *
   * @param topic_id
   * @param student_id
   * @param group_id
   * @returns
   * @todo 查询小组成员的修改、总结、修改等状态，生成堆栈格式数据
   */
  public async queryDashboard(
    topic_id: number,
    student_id: number,
    group_id: number,
  ) {
    const [
      individualArgument,
      peerInteraction,
      nicknameOfGroup,
      replyAndModify,
      topicProcess,
    ] = await Promise.all([
      this.queryIndividualArgument(topic_id, student_id),
      this.queryPeerInteraction(topic_id, group_id),
      this.queryGroupNicknames(group_id),
      this.queryReplyAndModifyData(topic_id, group_id),
      this.queryTopicProcess(topic_id),
    ]);

    const {
      individualRadarFormatter,
      peerInteractionFormatter,
      replyAndModifyFormatter,
    } = this.formatter();

    return {
      data: {
        radarOption: individualRadarFormatter(individualArgument),
        graphOption: peerInteractionFormatter(peerInteraction, nicknameOfGroup),
        barOption: replyAndModifyFormatter(replyAndModify, nicknameOfGroup),
        timeLineList: topicProcess,
      },
    };
  }

  public async queryGroupOpinionList({
    topic_id,
    group_id,
    page,
    page_size,
  }: {
    topic_id: number;
    group_id: number;
    page: number;
    page_size: number;
  }) {
    // TODO: 查询小组观点列表
    const sql = `
    SELECT
      nt.id,
      nt.content,
      st.nickname,
      gt.group_color 
    FROM
      node_table nt
      JOIN \`student\` st ON st.id = nt.student_id
      JOIN \`group\` gt ON gt.id = st.group_id 
    WHERE
      nt.topic_id = ${topic_id} 
      AND st.group_id = ${group_id}
    LIMIT ${page_size} OFFSET ${page * page_size}
    `;
    const result = await this.query<{
      id: number;
      content: string;
      nickname: string;
      group_color: string;
    }>(sql);
    const totalNumSql = `
        SELECT
          COUNT(*) as count
        FROM
          node_table nt
          JOIN \`student\` st ON st.id = nt.student_id
          JOIN \`group\` gt ON gt.id = st.group_id 
        WHERE
          nt.topic_id = ${topic_id} 
          AND st.group_id = ${group_id}
    `;
    const totalNum = await this.query<{ count: number }>(totalNumSql);

    return {
      data: {
        list: result.map((item) => ({
          ...item,
          content: item.content ? item.content : '空',
        })),
        total: totalNum[0].count,
      },
    };
  }

  /**
   *
   * @param topic_id 主题id
   * @description 制作词云
   */
  public async queryWordCloud(topic_id: number) {
    // plan 1 在后端将词云内容直接查出来，拼接起来
    // 前端利用浏览器的API做词云
    if (!topic_id) {
      throw new HttpException('topic_id is required', 400);
    }
    const sql = `
    SELECT
      a.content,
      g.id group_id,
      g.group_name 
    FROM
      argunode a
      LEFT JOIN node_table n ON n.id = a.arguKey
      LEFT JOIN student s ON s.id = n.student_id
      LEFT JOIN \`group\` g ON g.id = s.group_id 
      OR n.group_id = g.id 
    WHERE
      n.topic_id = ${topic_id}
    `;
    const result = await this.query<{
      content: string;
      group_id: number;
      group_name: string;
    }>(sql);
    const groupedResult = _.groupBy(result, (res) => res.group_name);
    const list = Object.keys(groupedResult).map((key) => {
      const group = groupedResult[key];
      // 拼接content
      const text = group.map((item) => item.content).join(' ');
      return {
        group_name: key,
        text,
      };
    });

    return {
      data: {
        list,
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

  /**
   *
   * @param topic_id
   * @param student_id
   * @description 依据主题和学生的id查询该学生小组的互动情况
   */
  private async queryPeerInteraction(topic_id: number, gruop_id: number) {
    const sql = `
    SELECT 
        e.id,
        e.type,
        e.source,
        n1.student_id AS source_student_id,
        s1.id AS source_group_id,
        s1.nickname AS source_nickname,
        e.target,
        n2.student_id AS target_student_id,
        s2.group_id AS target_group_id,
        s2.nickname AS target_nickname
    FROM 
        edge_table e
    JOIN 
        node_table n1 ON e.source = n1.id
    JOIN 
        student s1 ON n1.student_id = s1.id
    JOIN 
        node_table n2 ON e.target = n2.id
    JOIN 
        student s2 ON n2.student_id = s2.id
    WHERE 
        e.topic_id = ${topic_id}
    AND 
        (e.type = 'reject' OR e.type = 'approve')
    AND 
        s1.group_id = ${gruop_id}
    AND 
        s2.group_id = s1.group_id;`;

    const res = await this.query<{
      id: number;
      type: string;
      source: string;
      source_student_id: number;
      source_group_id: number;
      source_nickname: string;
      target: string;
      target_student_id: number;
      target_group_id: number;
      target_nickname: string;
    }>(sql);
    return res;
  }

  private async queryGroupNicknames(group_id: number) {
    const sql = `
    SELECT
      s.nickname 
    FROM
      student s 
    WHERE
      s.group_id = ${group_id};`;
    return await this.query<{ nickname: string }>(sql);
  }

  private async queryReplyAndModifyData(topic_id: number, group_id: number) {
    const sqlReplyCount = `
    SELECT
      student.nickname AS nickname,
      SUM( CASE WHEN edge_table.type = 'idea_to_group' THEN 1 ELSE 0 END ) AS proposeNum,
      SUM( CASE WHEN edge_table.type = 'reject' THEN 1 ELSE 0 END ) AS rejectNum,
      SUM( CASE WHEN edge_table.type = 'approve' THEN 1 ELSE 0 END ) AS approveNum
    FROM
      edge_table
      JOIN node_table ON node_table.id = edge_table.source
      JOIN student ON student.id = node_table.student_id
      JOIN \`group\` ON \`group\`.id = student.group_id 
    WHERE
      \`group\`.id = ${group_id} and node_table.topic_id = ${topic_id} 
    GROUP BY
      student.id;`;

    const sqlModifyCount = `
    SELECT
      student_id,
      nickname,
      SUM( modify_count ) AS total_modify_count 
    FROM
      (
      SELECT
        a.arguKey,
        n.student_id,
        s.nickname,
        MAX( a.version ) - MIN( a.version ) + 1 AS modify_count 
      FROM
        argunode a
        JOIN node_table n ON n.id = arguKey
        JOIN student s ON s.id = n.student_id 
      WHERE
        n.topic_id = ${topic_id}
        AND s.group_id = ${group_id}
        AND n.type = 'idea' 
      GROUP BY
        a.arguKey,
        n.student_id
      ) AS subquery 
    GROUP BY
      student_id;`;

    const [replyCount, modifyCount] = await Promise.all([
      this.query<{
        nickname: string;
        proposeNum: number;
        rejectNum: number;
        approveNum: number;
      }>(sqlReplyCount),
      this.query<{
        student_id: number;
        nickname: string;
        total_modify_count: string;
      }>(sqlModifyCount),
    ]);

    return {
      replyCount,
      modifyCount,
    };
  }
}
