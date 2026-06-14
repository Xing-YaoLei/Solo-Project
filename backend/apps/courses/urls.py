from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ChapterViewSet, EnrollmentViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'chapters', ChapterViewSet)
router.register(r'enrollments', EnrollmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
