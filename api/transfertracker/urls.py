from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r'transfer-records', views.TransferRecordViewSet, basename='transfer-record')
router.register(r'exception-items', views.ExceptionItemViewSet, basename='exception-item')
router.register(r'file-uploads', views.FileUploadView, basename='file-upload')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('analytics/overview/', views.analytics_overview, name='analytics-overview'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('users/', views.user_list, name='user-list'),
]
