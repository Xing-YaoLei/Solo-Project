from pydantic import BaseModel, Field


class VerificationData(BaseModel):
    dimension: str = Field(description="维度")
    dimensionValue: str = Field(description="维度值")
    totalTickets: int = Field(description="总票数")
    verifiedTickets: int = Field(description="已核销票数")
    verificationRate: float = Field(description="核销率")
    avgVerifyTime: float = Field(description="平均核销时间")
    caliberVersion: str = Field(description="口径版本")


class CaliberVersion(BaseModel):
    version: str = Field(description="版本号")
    name: str = Field(description="版本名称")
    formula: str = Field(description="计算公式")
    description: str = Field(description="描述")
    effectiveDate: str = Field(description="生效日期")
    changeReason: str = Field(description="变更原因")
