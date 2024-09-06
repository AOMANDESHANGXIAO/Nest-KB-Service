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
3. 

