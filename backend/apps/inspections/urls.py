from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InspectionReportViewSet

router = DefaultRouter()
router.register(r'inspections', InspectionReportViewSet, basename='inspection')

urlpatterns = [
    path('', include(router.urls)),
]
