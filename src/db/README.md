此模块处理数据库的连接。
index.ts
通过实现一个SqlService类，让业务模块的类继承此类，即可使用一系列方法完成对数据库的操作。

在该类中，我们还封装了一些生成SQL语句的方法，方便业务模块调用。
