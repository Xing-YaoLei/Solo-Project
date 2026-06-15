from rest_framework.routers import DefaultRouter
from .views import ProgressViewSet, GradeViewSet, ChapterCompletionViewSet

router = DefaultRouter()
router.register(r"", ProgressViewSet, basename="progress")
router.register(r"grades", GradeViewSet, basename="grade")
router.register(r"chapter-completions", ChapterCompletionViewSet, basename="chapter-completion")

urlpatterns = router.urls
