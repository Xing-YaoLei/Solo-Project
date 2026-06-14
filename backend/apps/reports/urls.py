from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DownloadRecordViewSet, MonthlyReviewViewSet

router = DefaultRouter()
router.register(r'downloads', DownloadRecordViewSet)
router.register(r'monthly-reviews', MonthlyReviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
