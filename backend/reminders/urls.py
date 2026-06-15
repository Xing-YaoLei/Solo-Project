from rest_framework.routers import DefaultRouter
from .views import ReminderRuleViewSet, ReminderLogViewSet

router = DefaultRouter()
router.register(r"rules", ReminderRuleViewSet, basename="reminder-rule")
router.register(r"logs", ReminderLogViewSet, basename="reminder-log")

urlpatterns = router.urls
