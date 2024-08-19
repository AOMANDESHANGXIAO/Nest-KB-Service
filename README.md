# 这个仓库存放了知识建构平台的后端服务源代码。

此服务使用Nest.js编写。
Nest.js中文文档地址：https://nestjs.bootcss.com/

## 项目启动:

1. 安装项目依赖

```shell
pnpm install
```

2. 启动服务

```shell
pnpm dev
```

如果项目启动成功，则可以在控制台看到输出:service is running on: http://localhost:3000/


## 项目结构

```
knowledge-building-web
├─ .eslintrc.js
├─ .gitignore
├─ .prettierrc
├─ nest-cli.json
├─ package.json
├─ pnpm-lock.yaml
├─ README.md
├─ src              ## 项目的主目录
│  ├─ app.controller.spec.ts
│  ├─ app.controller.ts
│  ├─ app.module.ts
│  ├─ app.service.ts
│  ├─ classroom
│  │  ├─ classroom.controller.ts
│  │  ├─ classroom.module.ts
│  │  ├─ classroom.service.ts
│  │  └─ Models
│  │     ├─ index.ts
│  │     └─ README.md
│  ├─ config.ts # 项目的配置文件，包含数据库、运行端口、jwt配置
│  ├─ crud # 封装一些复杂的数据库表增删改查操作
│  │  ├─ ArguEdge.ts
│  │  ├─ ArguNode.ts
│  │  ├─ Classroom.ts
│  │  ├─ Discussion.ts
│  │  ├─ EdgeTable.ts
│  │  ├─ Group.ts
│  │  ├─ index.ts
│  │  ├─ NodeTable.ts
│  │  ├─ NodeTable.type.ts # 操作数据库表的类型
│  │  ├─ README.md
│  │  ├─ Student.ts
│  │  └─ Table.model.ts # 整个项目中使用数据库表的定义
│  ├─ db
│  │  ├─ index.ts # 提供一个sqlService，封装了数据库的基本操作
│  │  └─ README.md
│  ├─ discuss
│  │  ├─ discuss.controller.ts
│  │  ├─ discuss.module.ts
│  │  ├─ discuss.service.ts
│  │  └─ Models
│  │     └─ index.ts
│  ├─ docs
│  │  └─ record.md
│  ├─ flow
│  │  ├─ flow.controller.ts
│  │  ├─ flow.module.ts
│  │  ├─ flow.service.ts
│  │  └─ Models
│  │     └─ index.ts
│  ├─ group
│  │  ├─ group.controller.ts
│  │  ├─ group.module.ts
│  │  ├─ group.service.ts
│  │  └─ Models
│  │     └─ index.ts
│  ├─ interceptors 
│  │  ├─ filter.interceptor.ts # 全局错误过滤器中间件
│  │  ├─ README.md
│  │  └─ response.interceptor.ts # 全局响应拦截器中间件
│  ├─ main.ts # 程序入口
│  ├─ spec
│  │  └─ index.ts
│  ├─ token ## token中间件文件夹
│  │  ├─ token.middleware.spec.ts # 测试
│  │  └─ token.middleware.ts # token中间件
│  ├─ user
│  │  ├─ Models
│  │  │  └─ index.ts
│  │  ├─ user.controller.ts
│  │  ├─ user.module.ts
│  │  └─ user.service.ts
│  └─ utils
│     ├─ jwt.handler.ts
│     └─ password.handler.ts
├─ test
│  ├─ app.e2e-spec.ts
│  └─ jest-e2e.json
├─ tsconfig.build.json
└─ tsconfig.json
```

## 业务模块
在Nest.js中，每个业务模块都是单独的目录，每个目录下都有自己的控制器、服务、模型等文件。
例如，classroom目录下包含三个文件：classroom.controller.ts、classroom.service.ts、Models/index.ts。
controller.ts文件定义了控制器，负责接收请求并传递给service层。service.ts文件定义了服务，包含一系列响应请求的方法。Models/index.ts文件定义了模型。
看一眼应该就能知道每个模块能处理哪些请求。

## 扩展模块
使用我配置好的命令行即可生成一个业务模块，包含controller、service等文件。
```
pnpm r
```
这里的r是简写(resource)。


That is all.