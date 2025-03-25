from django.urls import path
from .views import SignupAPIView, VerifyOTPAPIView

urlpatterns = [
    path('signup/', SignupAPIView.as_view(), name='signup'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify_otp'),
]

