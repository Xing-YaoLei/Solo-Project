from typing import Optional
from pydantic import BaseModel, Field


class SyncBatch(BaseModel):
    batchId: str = Field(description="批次ID")
    source: str = Field(description="数据源: ticket_platform/gate_record/payment_flow")
    status: str = Field(description="状态: pending/running/success/failed")
    totalRecords: int = Field(description="总记录数")
    processedRecords: int = Field(description="已处理记录数")
    startTime: str = Field(description="开始时间")
    endTime: Optional[str] = Field(default=None, description="结束时间")
    errorMessage: Optional[str] = Field(default=None, description="错误信息")
    syncDate: str = Field(description="同步日期")


class SyncTask(BaseModel):
    taskId: str = Field(description="任务ID")
    name: str = Field(description="任务名称")
    source: str = Field(description="数据源")
    cronExpression: str = Field(description="cron表达式")
    lastRunTime: Optional[str] = Field(default=None, description="上次运行时间")
    nextRunTime: str = Field(description="下次运行时间")
    status: str = Field(description="状态: active/paused/error")
