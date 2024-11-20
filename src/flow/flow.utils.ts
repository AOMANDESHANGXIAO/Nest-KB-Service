import { CreateNewIdeaArgs } from './Models';

function getFormatterContent(nodes: CreateNewIdeaArgs['nodes']) {
  const nodeChineseMapping = {
    backing: '支持',
    warrant: '担保',
    claim: '结论',
    qualifier: '限定词',
    rebuttal: '反驳',
    data: '前提',
  };

  return nodes
    .map((node) => {
      const { inputValue, _type } = node.data;
      return `${nodeChineseMapping[_type]}: ${inputValue}`;
    })
    .join('\n');
}

export { getFormatterContent };
