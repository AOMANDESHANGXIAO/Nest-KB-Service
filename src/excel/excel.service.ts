import { Injectable } from '@nestjs/common';
import { SqlService } from 'src/db';
import * as ExcelJS from 'exceljs'; // 引入 exceljs

@Injectable()
export class ExcelService extends SqlService {
  constructor() {
    super();
  }
  /**
   * 获取所有idea的excel
   */
  async getAllIdeaExcel(topic_id: number) {
    const sql = `
    SELECT
      vp.id,
      vp.type,
      target_vp.type AS target_type,
      vp.group_id,
      g.group_name AS student_group_node_name,
      g1.group_name AS group_node_name,
      s1.nickname,
      vp.student_id,
      vp.created_time,
      vp.idea_conclusion,
      vp.idea_limitation,
      vp.idea_reason,
      vp.disagree_viewpoint,
      vp.disagree_reason,
      vp.disagree_suggestion,
      vp.agree_viewpoint,
      vp.agree_reason,
      vp.agree_supplement,
      vp.ask_question,
      vp.response_content,
      target_vp.student_id AS target_student_id,
      s2.nickname AS target_student_name,
      target_vp.idea_conclusion AS target_idea_conclusion,
      target_vp.idea_limitation AS target_idea_limitation,
      target_vp.idea_reason AS target_idea_reason,
      target_vp.disagree_viewpoint AS target_disagree_viewpoint,
      target_vp.disagree_reason AS target_disagree_reason,
      target_vp.disagree_suggestion AS target_disagree_suggestion,
      target_vp.agree_viewpoint AS target_agree_viewpoint,
      target_vp.agree_reason AS target_agree_reason,
      target_vp.agree_supplement AS target_agree_supplement,
      target_vp.ask_question AS target_ask_question,
      target_vp.response_content AS target_response_content 
    FROM
      \`viewpoint\` vp
      LEFT JOIN student s1 ON s1.id = vp.student_id
      LEFT JOIN \`group\` g ON g.id = s1.group_id
      LEFT JOIN \`group\` g1 ON g1.id = vp.group_id
      LEFT JOIN \`viewpoint\` target_vp ON target_vp.id = vp.target
      LEFT JOIN student s2 ON s2.id = target_vp.student_id 
    WHERE
      vp.topic_id = ${topic_id} AND vp.type != 'topic'
    ORDER BY
      vp.group_id,
      vp.created_time;`;
    const data = await this.query<{
      id: number;
      type: 'group' | 'agree' | 'disagree' | 'response' | 'ask' | 'idea';
      target_type: 'group' | 'agree' | 'disagree' | 'response' | 'ask' | 'idea';
      group_id: number;
      student_group_id: number;
      student_group_node_name: string;
      group_node_name: string;
      nickname: string;
      student_id: number;
      created_time: Date;
      idea_conclusion: string;
      idea_limitation: string;
      idea_reason: string;
      disagree_viewpoint: string;
      disagree_reason: string;
      disagree_suggestion: string;
      agree_viewpoint: string;
      agree_reason: string;
      agree_supplement: string;
      ask_question: string;
      response_content: string;
      target_student_id: number;
      target_student_name: string;
      target_idea_conclusion: string;
      target_idea_limitation: string;
      target_idea_reason: string;
      target_disagree_viewpoint: string;
      target_disagree_reason: string;
      target_disagree_suggestion: string;
      target_agree_viewpoint: string;
      target_agree_reason: string;
      target_agree_supplement: string;
      target_ask_question: string;
      target_response_content: string;
    }>(sql);

    /**
     * 处理data，将自己的结论加起来，将回复的结论加起来
     */
    const selectTypeReflectKey = {
      group: ['idea_conclusion', 'idea_reason', 'idea_limitation'],
      idea: ['idea_conclusion', 'idea_reason', 'idea_limitation'],
      agree: ['agree_viewpoint', 'agree_reason', 'agree_supplement'],
      disagree: [
        'disagree_viewpoint',
        'disagree_reason',
        'disagree_suggestion',
      ],
      ask: ['ask_question'],
      response: ['response_content'],
    };
    const selectTargetTypeReflectKey = {
      group: [
        'target_idea_conclusion',
        'target_idea_reason',
        'target_idea_limitation',
      ],
      idea: [
        'target_idea_conclusion',
        'target_idea_reason',
        'target_idea_limitation',
      ],
      agree: [
        'target_agree_viewpoint',
        'target_agree_reason',
        'target_agree_supplement',
      ],
      disagree: [
        'target_disagree_viewpoint',
        'target_disagree_reason',
        'target_disagree_suggestion',
      ],
      ask: ['target_ask_question'],
      response: ['target_response_content'],
    };
    const selectContentKeyMap = {
      idea_conclusion: '结论',
      idea_reason: '理由',
      idea_limitation: '限定条件',
      disagree_viewpoint: '反对的点',
      disagree_reason: '反对理由',
      disagree_suggestion: '改进建议',
      agree_viewpoint: '同意的点',
      agree_reason: '同意理由',
      agree_supplement: '可改进的点',
      ask_question: '困惑的点',
      response_content: '对困惑的解释',
    };
    const selectTargetContentKeyMap = {
      target_idea_conclusion: '目标结论',
      target_idea_reason: '目标理由',
      target_idea_limitation: '目标限定条件',
      target_disagree_viewpoint: '目标反对的点',
      target_disagree_reason: '目标反对理由',
      target_disagree_suggestion: '目标改进建议',
      target_agree_viewpoint: '目标同意的点',
      target_agree_reason: '目标同意理由',
      target_agree_supplement: '目标可改进的点',
      target_ask_question: '目标困惑的点',
      target_response_content: '目标对困惑的解释',
    };

    const result = data.map((item) => {
      let content = '';
      selectTypeReflectKey[item.type]?.forEach((element) => {
        if (item[element]) {
          content += `${selectContentKeyMap[element]}: ${item[element]}\n`;
        }
      });
      let targetContent = '';
      selectTargetTypeReflectKey[item.target_type]?.forEach((element) => {
        if (item[element]) {
          targetContent += `${selectTargetContentKeyMap[element]}: ${
            item[element]
          }\n`;
        }
      });

      return {
        student_nickname: item.nickname || '',
        create_time: String(item.created_time),
        group_name: item.group_node_name || item.student_group_node_name || '',
        // group_node_name: item.group_node_name || '',
        // student_group_node_name: item.student_group_node_name || '',
        student_id: String(item.student_id) || '',
        target_student_id: String(item.target_student_id) || '',
        target_student_name: item.target_student_name || '',
        type: item.type,
        group_id: String(item.group_id),
        content: content,
        targetContent: targetContent,
      };
    });
    const columns = [
      // { header: '学生id', key: 'student_id', width: 20 },
      { header: '学生', key: 'student_nickname', width: 20 },
      { header: '所在组', key: 'group_name', width: 20 },
      // { header: '目标学生id', key: 'target_student_id', width: 20 },
      { header: '被回复的学生', key: 'target_student_name', width: 20 },
      { header: '类型', key: 'type', width: 20 },
      { header: '创建时间', key: 'create_time', width: 20 },
      // { header: '所在组', key: 'group_node_name', width: 20 },
      { header: '内容', key: 'content', width: 20 },
      { header: '被回复的内容', key: 'targetContent', width: 20 },
    ];
    return this.exportExcel({ data: result, columns });
  }

  async getChatMessageExcel(topic_id: number) {
    const sql = `
    SELECT
      c.id,
      s.nickname,
      g.group_name,
      c.message,
      c.student,
      c.created_time,
      c.success,
      c.gpt_response 
    FROM
      chat_message_storage c
      JOIN student s ON s.id = c.student
      JOIN \`group\` g ON g.id = s.group_id 
    WHERE
      c.topic = ${topic_id}
    ORDER BY
      g.group_name,
      c.created_time;`;
    const result = await this.query<{
      id: number;
      nickname: string;
      group_name: string;
      message: string;
      student: number;
      created_time: Date;
      success: boolean;
      gpt_response: string;
    }>(sql);
    const data = result.map((item) => {
      return {
        id: String(item.id),
        nickname: item.nickname,
        group_name: item.group_name,
        message: item.message,
        student: item.student,
        created_time: String(item.created_time),
        success: item.success ? '成功' : '失败',
        gpt_response: item.gpt_response,
      };
    });
    const columns = [
      { header: 'id', key: 'id', width: 20 },
      { header: '学生', key: 'nickname', width: 20 },
      { header: '所在组', key: 'group_name', width: 20 },
      { header: '发给GPT的', key: 'message', width: 20 },
      { header: '回复', key: 'gpt_response', width: 20 },
      { header: '是否成功', key: 'success', width: 20 },
      { header: '创建时间', key: 'created_time', width: 20 },
    ];
    return this.exportExcel<any>({ data, columns });
  }

  /**
   * 导出 Excel 表格
   */
  async exportExcel<
    T extends Record<string, string>, // 确保 T 的键是 string
  >(params: {
    data: T[];
    columns: { header: string; key: string; width: number }[]; // key 必须是 T 的键
  }) {
    const { data, columns } = params;
    // 接收数据参数
    const workbook = new ExcelJS.Workbook(); // 创建工作簿
    const worksheet = workbook.addWorksheet('Sheet1'); // 添加工作表

    // 设置表头
    worksheet.columns = columns;

    // 添加数据行
    data.forEach((item) => {
      worksheet.addRow(item);
    });

    // 设置响应头，导出 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();

    return buffer; // 返回 Excel 文件的缓冲区
  }
}
