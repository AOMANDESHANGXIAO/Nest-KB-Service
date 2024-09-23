## 思考
需要添加一张表记录对于Discussion的操作情况。
讨论话题操作为: 反馈, 总结, 关闭
那么一张表就需要几个字段。
id 主键
action 操作，枚举。'feedback' | 'summary' | 'close'
discuss_id  pk 连接discuss表
created_time Date 创建时间
operator_id pk 操作者? 是否有必要？

## 思考
需要添加一张表来记录观点的批判性思维元素构成
  'recognition',
  'understanding',
  'evaluation',
  'analysis',
  'create',
id 主键
recognition int 0 表示不包含, 1表示包含
understanding
evaluation
analysis
create
node_table_id pk 连接外部的评分
version int 版本号