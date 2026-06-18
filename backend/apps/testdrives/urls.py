from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TestDriveRecordViewSet

router = DefaultRouter()
router.register(r'testdrives', TestDriveRecordViewSet, basename='testdrive')

urlpatterns = [
    path('', include(router.urls)),
]
