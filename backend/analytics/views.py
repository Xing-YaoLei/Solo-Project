from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncMonth, TruncQuarter
from distributions.models import Distribution
from risk.models import RiskRecord
from progress_app.models import Progress
from students.models import Student


def _exclude_irrelevant_filter(request, queryset, student_field="student"):
    exclude = request.query_params.get("exclude_irrelevant", "false").lower() in ("true", "1", "yes")
    if exclude:
        queryset = queryset.filter(**{f"{student_field}__status": "active"})
    return queryset


class CompletionTrendView(APIView):

    def get(self, request):
        period = request.query_params.get("period", "month")
        course_id = request.query_params.get("course_id")

        distributions = Distribution.objects.all()
        distributions = _exclude_irrelevant_filter(request, distributions, "student")
        if course_id:
            distributions = distributions.filter(material__course_id=course_id)

        if period == "quarter":
            truncate = TruncQuarter
        elif period == "year":
            truncate = TruncMonth
        else:
            truncate = TruncMonth

        trend = (
            distributions.annotate(period=truncate("distributed_at"))
            .values("period")
            .annotate(
                total=Count("id"),
                completed=Count("id", filter=Q(status="completed")),
            )
            .order_by("period")
        )

        labels = []
        planned = []
        actual = []
        for item in trend:
            if item["period"]:
                labels.append(item["period"].strftime("%Y-%m"))
                planned.append(item["total"])
                rate = round(item["completed"] / item["total"] * 100, 1) if item["total"] > 0 else 0
                actual.append(rate)

        return Response({"labels": labels, "planned": planned, "actual": actual})


class RiskDistributionView(APIView):

    def get(self, request):
        course_id = request.query_params.get("course_id")

        risks = RiskRecord.objects.all()
        risks = _exclude_irrelevant_filter(request, risks, "distribution__student")
        if course_id:
            risks = risks.filter(distribution__material__course_id=course_id)

        level_counts = risks.values("risk_level").annotate(count=Count("id"))
        result = {item["risk_level"]: item["count"] for item in level_counts}
        for key, _ in RiskRecord.RISK_LEVEL_CHOICES:
            result.setdefault(key, 0)

        by_course = {}
        course_risks = risks.values("distribution__material__course__name", "risk_level").annotate(
            count=Count("id")
        )
        for item in course_risks:
            course_name = item["distribution__material__course__name"] or "未分配课程"
            if course_name not in by_course:
                by_course[course_name] = {"high": 0, "medium": 0, "low": 0}
            by_course[course_name][item["risk_level"]] = item["count"]

        return Response({"high": result.get("high", 0), "medium": result.get("medium", 0), "low": result.get("low", 0), "by_course": by_course})


class OverviewView(APIView):

    def get(self, request):
        students = Student.objects.all()
        students = _exclude_irrelevant_filter(request, students, "student") if False else students
        exclude = request.query_params.get("exclude_irrelevant", "false").lower() in ("true", "1", "yes")
        if exclude:
            students = students.filter(status="active")
        total_students = students.count()

        distributions = Distribution.objects.all()
        distributions = _exclude_irrelevant_filter(request, distributions, "student")
        total_distributions = distributions.count()
        completed_count = distributions.filter(status="completed").count()
        completion_rate = round(completed_count / total_distributions * 100, 1) if total_distributions > 0 else 0

        risks = RiskRecord.objects.all()
        risks = _exclude_irrelevant_filter(request, risks, "distribution__student")
        risk_count = risks.count()

        pending_count = distributions.filter(status="pending").count()

        return Response({
            "total_students": total_students,
            "completion_rate": completion_rate,
            "risk_count": risk_count,
            "pending_count": pending_count,
        })
