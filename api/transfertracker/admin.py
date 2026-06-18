from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, TransferRecord, Quotation, FinanceDoc, VehicleProfile, FileAttachment, ExceptionItem, ExceptionNote, ReviewTag


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = '角色'


class CustomUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(TransferRecord)
admin.site.register(Quotation)
admin.site.register(FinanceDoc)
admin.site.register(VehicleProfile)
admin.site.register(FileAttachment)
admin.site.register(ExceptionItem)
admin.site.register(ExceptionNote)
admin.site.register(ReviewTag)
