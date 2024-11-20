export function escapeSqlString(str: string): string {
  return str.replace(/[\0\n\r\b\t\\'"\x1a]/g, (s) => {
    switch (s) {
      case '\0':
        return '\\0';
      case '\n':
        return '\\n';
      case '\r':
        return '\\r';
      case '\b':
        return '\\b';
      case '\t':
        return '\\t';
      case '\x1a':
        return '\\Z';
      case "'":
        return "''"; // 在 SQL 中，单引号需要用两个单引号转义
      case '"':
        return '\\"';
      case '\\':
        return '\\\\';
      default:
        return s;
    }
  });
}
