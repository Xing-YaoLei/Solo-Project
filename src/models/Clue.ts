import type { ClueType, ProblemType } from './index';

export interface Clue {
  /** 线索唯一标识 */
  id: string;
  /** 所属关卡ID */
  levelId: string;
  /** 线索类型 */
  type: ClueType;
  /** 线索标题 */
  title: string;
  /** 线索描述 */
  description: string;
  /** 在工地中的位置坐标 */
  position: { x: number; y: number };
  /** 关联照片ID（可选） */
  photoId?: string;
  /** 问题类型 */
  problemType: ProblemType;
  /** 严重程度（1-5） */
  severity: number;
  /** 是否隐藏 */
  isHidden: boolean;
  /** 关联线索ID列表 */
  relatedClueIds: string[];
  /** 提示信息 */
  hint: string;
  /** 所需动作ID列表 */
  requiredActions: string[];
}
