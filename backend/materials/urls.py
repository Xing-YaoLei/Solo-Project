from rest_framework.routers import DefaultRouter
from .views import TagViewSet, MaterialViewSet

router = DefaultRouter()
router.register(r"tags", TagViewSet, basename="tag")
router.register(r"", MaterialViewSet, basename="material")

urlpatterns = router.urls
