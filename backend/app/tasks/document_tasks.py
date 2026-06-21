import re
from app.services.celery_app import celery_app
from app.config import settings
from app.database import SessionLocal
from app.models import Document, RiskHit


@celery_app.task(bind=True, name="analyze_risk_keywords")
def analyze_risk_keywords(self, document_id: int) -> dict:
    """异步分析文档中的风险词命中"""
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return {"status": "error", "message": "Document not found"}

        db.query(RiskHit).filter(RiskHit.document_id == document_id).delete()

        hits = []
        content = document.content or ""

        for keyword in settings.RISK_KEYWORDS:
            pattern = re.escape(keyword)
            for match in re.finditer(pattern, content):
                start_pos = match.start()
                end_pos = match.end()
                context_start = max(0, start_pos - 50)
                context_end = min(len(content), end_pos + 50)
                context = content[context_start:context_end]

                severity = "high" if keyword in [
                    "违约", "欺诈", "诉讼", "仲裁", "违法", "赔偿", "损失"
                ] else "medium"

                suggestions_map = {
                    "违约": "建议明确违约责任范围和赔偿上限",
                    "欺诈": "建议核实陈述真实性，增加反欺诈条款",
                    "诉讼": "建议优先约定仲裁条款，明确管辖地",
                    "仲裁": "建议确认仲裁机构选择和仲裁规则",
                    "违法": "建议进行合法性审查，咨询专业意见",
                    "赔偿": "建议明确赔偿计算方式和限额",
                    "损失": "建议明确损失认定标准和举证责任",
                    "风险": "建议进行风险评估，制定应对方案",
                    "争议": "建议明确争议解决方式和流程",
                    "终止": "建议明确终止条件和通知期限",
                }

                risk_hit = RiskHit(
                    document_id=document_id,
                    keyword=keyword,
                    context=context,
                    position_start=start_pos,
                    position_end=end_pos,
                    severity=severity,
                    suggestion=suggestions_map.get(keyword, "建议进一步审核此条款"),
                )
                db.add(risk_hit)
                hits.append(keyword)

        if hits:
            unique_hits = list(set(hits))
            high_risk_count = sum(1 for k in unique_hits if k in [
                "违约", "欺诈", "诉讼", "仲裁", "违法", "赔偿", "损失"
            ])
            if high_risk_count >= 3:
                document.risk_level = "high"
            elif high_risk_count >= 1 or len(unique_hits) >= 3:
                document.risk_level = "medium"
            else:
                document.risk_level = "low"
        else:
            document.risk_level = "low"

        db.commit()
        return {
            "status": "success",
            "document_id": document_id,
            "total_hits": len(hits),
            "unique_keywords": list(set(hits)),
            "risk_level": document.risk_level,
        }
    finally:
        db.close()


@celery_app.task(bind=True, name="verify_document_versions")
def verify_document_versions(self, document_id: int) -> dict:
    """异步核对文档版本一致性"""
    db = SessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return {"status": "error", "message": "Document not found"}

        versions = sorted(document.versions, key=lambda v: v.version_number)

        if len(versions) < 2:
            document.is_version_verified = True
            db.commit()
            return {
                "status": "success",
                "document_id": document_id,
                "verified": True,
                "message": "单版本无需核对",
                "version_count": len(versions),
            }

        issues = []
        for i in range(1, len(versions)):
            prev = versions[i - 1]
            curr = versions[i]
            if prev.version_number + 1 != curr.version_number:
                issues.append(f"版本号不连续: v{prev.version_number} -> v{curr.version_number}")
            if not curr.change_summary:
                issues.append(f"v{curr.version_number} 缺少变更说明")

        document.is_version_verified = len(issues) == 0
        db.commit()

        return {
            "status": "success",
            "document_id": document_id,
            "verified": len(issues) == 0,
            "issues": issues,
            "version_count": len(versions),
        }
    finally:
        db.close()
