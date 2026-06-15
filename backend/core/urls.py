from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/courses/", include("courses.urls")),
    path("api/materials/", include("materials.urls")),
    path("api/students/", include("students.urls")),
    path("api/distributions/", include("distributions.urls")),
    path("api/progress/", include("progress_app.urls")),
    path("api/risks/", include("risk.urls")),
    path("api/reminders/", include("reminders.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]
