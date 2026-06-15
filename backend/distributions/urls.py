from rest_framework.routers import DefaultRouter
from .views import DistributionViewSet

router = DefaultRouter()
router.register(r"", DistributionViewSet, basename="distribution")

urlpatterns = router.urls
