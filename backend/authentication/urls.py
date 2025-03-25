from django.urls import path
from .views import SignupAPIView, VerifyOTPAPIView, LoginAPIView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/', SignupAPIView.as_view(), name='signup'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify_otp'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

