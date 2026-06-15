from django.urls import path
from .views import CompletionTrendView, RiskDistributionView, OverviewView

urlpatterns = [
    path("completion-trend/", CompletionTrendView.as_view(), name="completion-trend"),
    path("risk-distribution/", RiskDistributionView.as_view(), name="risk-distribution"),
    path("overview/", OverviewView.as_view(), name="overview"),
]
