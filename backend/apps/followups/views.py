from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from .models import ReminderRule, RenewalFollowUp, FollowUpRecord, ScoreFeedback
from .serializers import (
    ReminderRuleSerializer,
    RenewalFollowUpSerializer,
    RenewalFollowUpDetailSerializer,
    FollowUpRecordSerializer,
    ScoreFeedbackSerializer
)


class ReminderRuleViewSet(viewsets.ModelViewSet):
    queryset = ReminderRule.objects.all()
    serializer_class = ReminderRuleSerializer
    filterset_fields = ['trigger_type', 'is_active']
    ordering_fields = ['created_at', 'name']


class RenewalFollowUpViewSet(viewsets.ModelViewSet):
    queryset = RenewalFollowUp.objects.all()
    serializer_class = RenewalFollowUpSerializer
    filterset_fields = ['status', 'priority', 'counselor', 'student', 'reminder_rule']
    search_fields = ['reason', 'student__username']
    ordering_fields = ['created_at', 'priority', 'next_follow_up_date']

    def get_queryset(self):
        queryset = super().get_queryset().annotate(records_count=Count('records'))
        user = self.request.user
        if user.role == 'counselor':
            queryset = queryset.filter(counselor=user)
        elif user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            queryset = queryset.filter(student__enrollments__course__teacher=user).distinct()
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RenewalFollowUpDetailSerializer
        return RenewalFollowUpSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.status = RenewalFollowUp.STATUS_IN_PROGRESS
        follow_up.save()
        return Response(RenewalFollowUpSerializer(follow_up).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.status = RenewalFollowUp.STATUS_COMPLETED
        follow_up.completed_at = timezone.now()
        follow_up.save()
        return Response(RenewalFollowUpSerializer(follow_up).data)

    @action(detail=True, methods=['post'])
    def mark_renewed(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.status = RenewalFollowUp.STATUS_RENEWED
        follow_up.completed_at = timezone.now()
        follow_up.save()

        enrollment = follow_up.enrollment
        if enrollment:
            from datetime import timedelta
            enrollment.renewal_due_date = (timezone.now() + timedelta(days=180)).date()
            enrollment.save()

        return Response(RenewalFollowUpSerializer(follow_up).data)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.status = RenewalFollowUp.STATUS_CLOSED
        follow_up.completed_at = timezone.now()
        follow_up.save()
        return Response(RenewalFollowUpSerializer(follow_up).data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        queryset = self.get_queryset()
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'completed': queryset.filter(status='completed').count(),
            'renewed': queryset.filter(status='renewed').count(),
            'closed': queryset.filter(status='closed').count(),
            'urgent': queryset.filter(priority='urgent').count(),
            'high': queryset.filter(priority='high').count(),
            'overdue': queryset.filter(
                next_follow_up_date__lt=timezone.now().date(),
                status__in=['pending', 'in_progress']
            ).count(),
        }
        return Response(stats)

    @action(detail=False, methods=['post'])
    def check_progress_and_create_reminders(self, request):
        from apps.courses.models import Enrollment
        rules = ReminderRule.objects.filter(is_active=True, trigger_type='progress_behind')

        created_count = 0
        for rule in rules:
            enrollments = Enrollment.objects.filter(
                status='active',
                progress__lt=rule.threshold
            ).select_related('student', 'course')

            for enrollment in enrollments:
                existing = RenewalFollowUp.objects.filter(
                    enrollment=enrollment,
                    reminder_rule=rule,
                    status__in=['pending', 'in_progress']
                ).exists()

                if not existing:
                    counselor = None
                    if hasattr(enrollment.student, 'student_profile'):
                        counselor = enrollment.student.student_profile.counselor

                    RenewalFollowUp.objects.create(
                        enrollment=enrollment,
                        student=enrollment.student,
                        counselor=counselor,
                        status=RenewalFollowUp.STATUS_PENDING,
                        priority=RenewalFollowUp.PRIORITY_HIGH,
                        reminder_rule=rule,
                        reason=f'课程进度{enrollment.progress}%，低于阈值{rule.threshold}%',
                        created_by=request.user
                    )
                    created_count += 1

        return Response({'created': created_count})


class FollowUpRecordViewSet(viewsets.ModelViewSet):
    queryset = FollowUpRecord.objects.all()
    serializer_class = FollowUpRecordSerializer
    filterset_fields = ['follow_up', 'method']
    ordering_fields = ['created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

        follow_up = serializer.instance.follow_up
        if follow_up.status == 'pending':
            follow_up.status = 'in_progress'
            follow_up.save()

        next_date = serializer.validated_data.get('next_date')
        if next_date:
            follow_up.next_follow_up_date = next_date
            follow_up.save()


class ScoreFeedbackViewSet(viewsets.ModelViewSet):
    queryset = ScoreFeedback.objects.all()
    serializer_class = ScoreFeedbackSerializer
    filterset_fields = ['enrollment', 'student', 'course']
    ordering_fields = ['feedback_date', 'score']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
