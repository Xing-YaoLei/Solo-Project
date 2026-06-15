from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import RiskRecordViewSet, CommunicationCreateView, ReviewCreateView

router = DefaultRouter()
router.register(r"", RiskRecordViewSet, basename="risk")

urlpatterns = router.urls + [
    path("communications/", CommunicationCreateView.as_view(), name="communication-create"),
    path("reviews/", ReviewCreateView.as_view(), name="review-create"),
]
