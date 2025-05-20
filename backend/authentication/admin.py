from django.contrib import admin
from .models import CustomUser
from django.contrib.auth.admin import UserAdmin

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'user_type')  # Remove 'groups'
    list_filter = ('user_type', 'groups')
    filter_horizontal = ('groups',)  # Still allows group assignment