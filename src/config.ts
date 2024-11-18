const config = {
  port: 3000 /* the port of the server */,
  db: {
    /* the config of the mysql database */
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'knowledgebuilding',
  },
  jwt: {
    /* the config of the jwt */ secretKey: 'TheRidiculousAdventurer',
    expiresIn: '30d', // 30d
    ignoreRoutes: [
      '/user/signin',
      '/user/signup',
      '/classroom/queryClassroomList',
      '/auth/login',
      '/auth/register',
      '/admin/sign/signin',
      '/admin/sign/signup',
    ],
  },
  fileOption: {
    staticFolder: 'assets',
    prefix: 'static',
  },
  isDev: true, // 标记是否是开发环境
  // isDev: false,
  serviceIp: '122.51.107.161', // 腾讯云服务器的地址，如果更换服务器手动更新地址
};
export default config;
