封装各个模块之间通用的对数据表的操作。

// 草稿
实现一个在提出论点时引用本组其他同学关于某知识点的讨论的接口。
1. 首先需要一张表记录引用情况 
     peer_reference_table
       id int // 自增
       from_argu_id int 外键 // 标记哪个论点的引用 argunode表
       to_argu_id int 外键 // 标记引用了哪一个论点 node_table表，方便根据id查询引用的论点的内容
       created_time datetime
2. 
3. // 草稿
  需要一个表来保存学习者的操作: student_action_log
  发布观点, 查看观点，查看小组观点，修改观点，同意观点，反驳观点，总结小组观点，修改小组观点。操作时间。

| 字段名       | 类型                                                         | 描述          | 约束                     |
| ------------ | ------------------------------------------------------------ | ------------- | ------------------------ |
| id           | int                                                          | 表的主键      | auto_increment           |
| action       | varchar(125)。值:propose, check,chech_idea, modify, approve,oppose,summary_group, modify_group, | 学生的操作    |                          |
| student_id   | int                                                          | 学生id        | PK，连接student表的id    |
| created_time | Date                                                         | 操作时间      | NOW()                    |
| node_id      | int                                                          | 操作的node_id | PK, 连接node_table表的id |

- [x] 提出观点
- [x] 检查观点
- [x] 检查组内观点
- [x] 修改观点
- [x] 总结小组观点
- [x] 修改小组观点
- [x] 支持观点
- [x] 反对观点
