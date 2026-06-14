from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Assignment, AssignmentSubmission, AssignmentChangeLog
from .serializers import (
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    AssignmentChangeLogSerializer
)


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    filterset_fields = ['course', 'chapter']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.all()
    serializer_class = AssignmentSubmissionSerializer
    filterset_fields = ['assignment', 'student', 'status']
    ordering_fields = ['submitted_at', 'score']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            queryset = queryset.filter(assignment__course__teacher=user)
        elif user.role == 'counselor':
            queryset = queryset.filter(student__student_profile__counselor=user)
        return queryset

    def _log_change(self, submission, field_name, old_value, new_value, change_type, reason='', action=''):
        AssignmentChangeLog.objects.create(
            submission=submission,
            changed_by=self.request.user,
            change_type=change_type,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            action=action
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        old_data = AssignmentSubmissionSerializer(instance).data

        reason = self.request.data.get('change_reason', '')
        change_action = self.request.data.get('change_action', '')

        updated_instance = serializer.save()
        new_data = AssignmentSubmissionSerializer(updated_instance).data

        tracked_fields = ['content', 'file_url', 'score', 'feedback', 'status']
        for field in tracked_fields:
            old_val = old_data.get(field)
            new_val = new_data.get(field)
            if old_val != new_val:
                self._log_change(
                    submission=updated_instance,
                    field_name=field,
                    old_value=old_val,
                    new_value=new_val,
                    change_type='update',
                    reason=reason,
                    action=change_action
                )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        submission = self.get_object()
        old_status = submission.status

        submission.content = request.data.get('content', submission.content)
        submission.file_url = request.data.get('file_url', submission.file_url)
        submission.submitted_at = timezone.now()
        submission.status = 'submitted'
        submission.save()

        self._log_change(
            submission=submission,
            field_name='status',
            old_value=old_status,
            new_value='submitted',
            change_type='submit',
            reason='学员提交作业',
            action='提交作业'
        )

        return Response(AssignmentSubmissionSerializer(submission).data)

    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        submission = self.get_object()
        old_score = submission.score
        old_feedback = submission.feedback
        old_status = submission.status

        score = request.data.get('score')
        feedback = request.data.get('feedback', '')
        reason = request.data.get('reason', '')

        if score is not None:
            submission.score = score
        submission.feedback = feedback
        submission.graded_at = timezone.now()
        submission.graded_by = request.user
        submission.status = 'graded'
        submission.save()

        if old_score != submission.score:
            self._log_change(
                submission=submission,
                field_name='score',
                old_value=old_score,
                new_value=submission.score,
                change_type='grade',
                reason=reason,
                action='批改作业-成绩'
            )

        if old_feedback != submission.feedback:
            self._log_change(
                submission=submission,
                field_name='feedback',
                old_value=old_feedback,
                new_value=submission.feedback,
                change_type='grade',
                reason=reason,
                action='批改作业-反馈'
            )

        if old_status != submission.status:
            self._log_change(
                submission=submission,
                field_name='status',
                old_value=old_status,
                new_value=submission.status,
                change_type='grade',
                reason=reason,
                action='批改作业-状态'
            )

        return Response(AssignmentSubmissionSerializer(submission).data)

    @action(detail=True, methods=['post'])
    def close_log(self, request, pk=None):
        log_id = request.data.get('log_id')
        action_desc = request.data.get('action', '')
        if not log_id:
            return Response({'error': '缺少log_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            log = AssignmentChangeLog.objects.get(id=log_id, submission_id=pk)
        except AssignmentChangeLog.DoesNotExist:
            return Response({'error': '日志不存在'}, status=status.HTTP_404_NOT_FOUND)

        log.closed_at = timezone.now()
        log.closed_by = request.user
        if action_desc:
            log.action = action_desc
        log.save()

        return Response(AssignmentChangeLogSerializer(log).data)


class AssignmentChangeLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssignmentChangeLog.objects.all()
    serializer_class = AssignmentChangeLogSerializer
    filterset_fields = ['submission', 'changed_by', 'change_type', 'field_name']
    ordering_fields = ['created_at']

    @action(detail=False, methods=['get'])
    def open_logs(self, request):
        logs = self.queryset.filter(closed_at__isnull=True)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
