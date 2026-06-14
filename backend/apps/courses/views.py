from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from .models import Course, Chapter, Enrollment
from .serializers import CourseSerializer, CourseDetailSerializer, ChapterSerializer, EnrollmentSerializer


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    filterset_fields = ['category', 'status', 'teacher']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        queryset = super().get_queryset().annotate(chapters_count=Count('chapters'))
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseSerializer

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        course = self.get_object()
        course.status = Course.STATUS_ACTIVE
        course.save()
        return Response({'status': 'published'})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        course = self.get_object()
        course.status = Course.STATUS_ARCHIVED
        course.save()
        return Response({'status': 'archived'})


class ChapterViewSet(viewsets.ModelViewSet):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    filterset_fields = ['course']
    ordering_fields = ['order', 'id']


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentSerializer
    filterset_fields = ['student', 'course', 'status']
    ordering_fields = ['enroll_date', 'progress']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'student':
            queryset = queryset.filter(student=user)
        elif user.role == 'teacher':
            queryset = queryset.filter(course__teacher=user)
        elif user.role == 'counselor':
            queryset = queryset.filter(student__student_profile__counselor=user)
        return queryset

    @action(detail=False, methods=['get'])
    def my_enrollments(self, request):
        enrollments = self.get_queryset().filter(student=request.user)
        serializer = self.get_serializer(enrollments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        enrollment = self.get_object()
        progress = request.data.get('progress')
        if progress is not None:
            enrollment.progress = min(100, max(0, int(progress)))
            if enrollment.progress >= 100:
                enrollment.status = Enrollment.STATUS_COMPLETED
            enrollment.save()
        return Response(EnrollmentSerializer(enrollment).data)
