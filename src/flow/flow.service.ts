import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import NodeCRUDer from 'src/crud/NodeTable';
import EdgeCRUDer from 'src/crud/EdgeTable';
import { IdeaType, TopicType, GroupType } from 'src/crud/NodeTable.type';
import { NodeTypeEnum } from 'src/crud/Table.model';
import { EdgeTable } from 'src/crud/Table.model';

@Injectable()
export class FlowService extends SqlService {
  nodeCruder: NodeCRUDer;
  edgeCruder: EdgeCRUDer;
  constructor() {
    super();
    this.nodeCruder = new NodeCRUDer(this);
    this.edgeCruder = new EdgeCRUDer(this);
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
          ...groups.map((item) => {
            return {
              id: String(item.node_id),
              type: NodeTypeEnum.group,
              data: {
                groupName: item.group_name,
                groupConclusion: item.content,
                bgc: item.group_color,
                group_id: item.group_id,
              },
              positon: {
                x: 0,
                y: 0,
              },
            };
          }),
          ...topics,
        ],
        edges: edges.map((item) => {
          return {
            id: String(item.id),
            source: String(item.source),
            target: String(item.target),
            _type: item.type,
            animated: false,
          };
        }),
      },
    };
  }
}
