from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, StudentProfileViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'student-profiles', StudentProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
