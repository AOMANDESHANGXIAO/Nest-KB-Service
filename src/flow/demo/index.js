const nodejieba = require('nodejieba');
const result = nodejieba.cut(
  '这是一个伸手不见五指的黑夜。我叫孙悟空，我爱北京，我爱Python和C++。',
);

console.log(result.filter((item) => item.length > 1).join('/'));
