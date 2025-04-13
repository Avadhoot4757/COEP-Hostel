from django.urls import path, include
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
    path('branches/', BranchView.as_view(), name='branches'),
    path('branches/<str:pk>/', BranchView.as_view(), name='branch-detail'),
    path('admission-categories/', AdmissionCategoryView.as_view(), name='admission-categories'),
    path('admission-categories/<str:pk>/', AdmissionCategoryView.as_view(), name='admission-category-detail'),
    path('castes/', CasteView.as_view(), name='castes'),
    path('castes/<str:pk>/', CasteView.as_view(), name='caste-detail'),
    path('apply/', StudentDataEntryView.as_view(), name='create-student'),
]

