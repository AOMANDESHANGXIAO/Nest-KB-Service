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

#### 查询每个观点得分Sql
SELECT
	n.id,
	n.type,
	n.student_id,
	g.id AS group_id,
	g.group_name,
	ns.recognition,
	ns.understanding,
	ns.evaluation,
	ns.analysis,
	ns.`create`,
	a.content,
	a.version
FROM
	node_table n
	LEFT JOIN node_table_score ns ON ns.node_table_id = n.id
	LEFT JOIN student s ON s.id = n.student_id
	LEFT JOIN `group` g ON g.id = s.group_id 
	OR g.id = n.group_id
	JOIN argunode a ON a.arguKey = n.id 
	AND a.type = 'claim' 
WHERE
	n.topic_id = 1 
	AND n.type != 'topic';
  
#### class_id查小组
SELECT
	g.id,
	g.group_name,
	g.group_description,
	g.group_code,
	g.group_color 
FROM
	`group` g 
WHERE
	g.belong_class_id = 1

#### 小组id查成员