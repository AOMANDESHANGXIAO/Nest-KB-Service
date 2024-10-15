/**
 * 处理保存到数据库中的文件路径
 */
import config from 'src/config';

export const getFilePath = (filename: string) => {
  const { staticFolder, prefix } = config.fileOption;
  const filePath = `/${prefix}/${staticFolder}/${filename}`;
  return filePath;
};
