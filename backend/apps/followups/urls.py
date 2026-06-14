from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReminderRuleViewSet, RenewalFollowUpViewSet, FollowUpRecordViewSet, ScoreFeedbackViewSet

router = DefaultRouter()
router.register(r'reminder-rules', ReminderRuleViewSet)
router.register(r'follow-ups', RenewalFollowUpViewSet)
router.register(r'records', FollowUpRecordViewSet)
router.register(r'score-feedbacks', ScoreFeedbackViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
