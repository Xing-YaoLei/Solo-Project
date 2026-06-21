import { ApiProperty } from '@nestjs/swagger';
import { HearingStatus } from '@prisma/client';

export class HearingAssignmentResponseDto {
  @ApiProperty({ description: '分派ID' })
  id: string;

  @ApiProperty({ description: '开庭ID' })
  hearingId: string;

  @ApiProperty({ description: '被指派用户ID' })
  assigneeId: string;

  @ApiProperty({ description: '被指派用户姓名' })
  assigneeName?: string;

  @ApiProperty({ description: '角色' })
  role: string;

  @ApiProperty({ description: '是否为主办' })
  isLead: boolean;

  @ApiProperty({ description: '备注' })
  notes?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: string;

  @ApiProperty({ description: '更新时间' })
  updatedAt: string;
}

export class StatusTimelineResponseDto {
  @ApiProperty({ description: '时间线ID' })
  id: string;

  @ApiProperty({ description: '开庭ID' })
  hearingId: string;

  @ApiProperty({ description: '变更前状态' })
  previousStatus?: string;

  @ApiProperty({ description: '变更后状态' })
  newStatus: string;

  @ApiProperty({ description: '变更类型' })
  changeType: string;

  @ApiProperty({ description: '变更说明' })
  description?: string;

  @ApiProperty({ description: '操作人ID' })
  operatorId: string;

  @ApiProperty({ description: '操作人姓名' })
  operatorName: string;

  @ApiProperty({ description: '变更原因' })
  changeReason?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: string;
}

export class HearingResponseDto {
  @ApiProperty({ description: '开庭ID' })
  id: string;

  @ApiProperty({ description: '开庭编号' })
  hearingNo: string;

  @ApiProperty({ description: '案件ID' })
  caseId: string;

  @ApiProperty({ description: '案件标题' })
  caseTitle?: string;

  @ApiProperty({ description: '案件编号' })
  caseNo?: string;

  @ApiProperty({ description: '法院ID' })
  courtId: string;

  @ApiProperty({ description: '法院名称' })
  courtName?: string;

  @ApiProperty({ description: '法庭ID' })
  courtRoomId: string;

  @ApiProperty({ description: '法庭编号' })
  courtRoomNo?: string;

  @ApiProperty({ description: '法庭名称' })
  courtRoomName?: string;

  @ApiProperty({ description: '审判长法官ID' })
  presidingJudgeId?: string;

  @ApiProperty({ description: '审判长姓名' })
  presidingJudgeName?: string;

  @ApiProperty({ description: '开始时间' })
  startTime: string;

  @ApiProperty({ description: '结束时间' })
  endTime: string;

  @ApiProperty({ description: '开庭类型' })
  hearingType: string;

  @ApiProperty({ description: '法官安排要点' })
  judgeSummary?: string;

  @ApiProperty({ description: '准备事项' })
  preparationItems?: string;

  @ApiProperty({ description: '需携带材料' })
  materials?: string;

  @ApiProperty({ description: '状态', enum: HearingStatus })
  status: HearingStatus;

  @ApiProperty({ description: '是否重要开庭' })
  isImportant: boolean;

  @ApiProperty({ description: '优先级 1-10' })
  priority: number;

  @ApiProperty({ description: '创建人ID' })
  creatorId: string;

  @ApiProperty({ description: '创建人姓名' })
  creatorName?: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: string;

  @ApiProperty({ description: '更新时间' })
  updatedAt: string;

  @ApiProperty({ description: '分派人员列表', type: [HearingAssignmentResponseDto] })
  assignments?: HearingAssignmentResponseDto[];

  @ApiProperty({ description: '状态变更时间线', type: [StatusTimelineResponseDto] })
  timelines?: StatusTimelineResponseDto[];
}
