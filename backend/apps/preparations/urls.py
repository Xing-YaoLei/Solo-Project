from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PreparationOrderViewSet

router = DefaultRouter()
router.register(r'preparations', PreparationOrderViewSet, basename='preparation')

urlpatterns = [
    path('', include(router.urls)),
]
