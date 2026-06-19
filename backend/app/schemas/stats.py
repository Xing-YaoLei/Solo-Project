from pydantic import BaseModel


class StatsByChannel(BaseModel):
    channel: str
    count: int

    model_config = {"from_attributes": True}


class StatsByHandler(BaseModel):
    handler_name: str
    count: int

    model_config = {"from_attributes": True}


class StatsByClosureDuration(BaseModel):
    duration_range: str
    count: int

    model_config = {"from_attributes": True}


class StatsByReviewTag(BaseModel):
    tag: str
    count: int

    model_config = {"from_attributes": True}
