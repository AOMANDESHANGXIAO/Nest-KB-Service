const handleValue = (v: string | number) => {
  if (typeof v === 'string') {
    return `'${v}'`;
  } else {
    return v;
  }
};

const generateUpdateSql = (
  tableName: string,
  columValues: Array<{ column: string; value: string | number }>,
  where: Array<{
    column: string;
    value: string | number;
    charset?: '=' | '>' | '<' | '!=' | '>=' | '<=' | 'LIKE' | 'IN';
  }>,
) => {
  // 验证输入是否有效
  if (!tableName || !columValues || columValues.length === 0) {
    throw new Error('invalid input in generateUpdateSql');
  }

  const sql = columValues
    .map((columValue) => {
      return `${columValue.column} = ${handleValue(columValue.value)}`;
    })
    .join(', ');
  const whereSql = where
    .map((w) => {
      return `${w.column} ${w.charset || '='} ${handleValue(w.value)}`;
    })
    .join(' AND ');

  return `UPDATE ${tableName} SET ${sql} WHERE ${whereSql}';`;
};

const sql = generateUpdateSql(
  'group',
  [
    { column: 'group_name', value: 'test' },
    { column: 'group_description', value: 'test' },
  ],
  [
    {
      column: 'id',
      value: 1,
    },
    {
      column: 'class_id',
      value: 1,
    },
  ],
);

console.log(sql);
