from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import CookieTokenRefreshView

urlpatterns = [
    path('signup/', SignupAPIView.as_view(), name='signup'),
    path("user/", CurrentUser.as_view(), name='user'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify_otp'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', RequestPasswordResetAPIView.as_view(), name="password-reset"),
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmAPIView.as_view(), name="password-reset-confirm"),
    path('apply/', StudentDataEntryView.as_view(), name='create-student'),
]

