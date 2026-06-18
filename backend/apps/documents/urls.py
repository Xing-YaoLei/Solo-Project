from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleDocumentViewSet

router = DefaultRouter()
router.register(r'documents', VehicleDocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]
