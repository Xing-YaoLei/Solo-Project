from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, ReviewRecordViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'review-records', ReviewRecordViewSet, basename='review-record')

urlpatterns = [
    path('', include(router.urls)),
]
