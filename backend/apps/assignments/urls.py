from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, AssignmentSubmissionViewSet, AssignmentChangeLogViewSet

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet)
router.register(r'submissions', AssignmentSubmissionViewSet)
router.register(r'change-logs', AssignmentChangeLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
