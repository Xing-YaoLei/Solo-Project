from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, ChapterViewSet

router = DefaultRouter()
router.register(r"", CourseViewSet, basename="course")
router.register(r"chapters", ChapterViewSet, basename="chapter")

urlpatterns = router.urls
