interface CreateDto {
  group_name: string;
  group_color: string;
  group_description: string;
  student_id: number;
  class_id: number;
}

interface GroupTable {
  id: number;
  group_name: string;
  group_description: string;
  group_code: string;
  group_color: string;
  belong_class_id: number;
}

interface JoinDto {
  student_id: number;
  group_code: string;
}

export { CreateDto, GroupTable, JoinDto };
