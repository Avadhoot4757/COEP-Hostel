import random
from django.contrib.auth.models import Group
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import SignupSerializer, OTPVerificationSerializer, LoginSerializer

CustomUser = get_user_model()

class SignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            verification_code = ''.join(random.choices('0123456789', k=6))

            request.session['verification_code'] = verification_code
            request.session['email'] = data['email']
            request.session['username'] = data['username']
            request.session['password'] = data['password']
            request.session['year'] = data['year']

            # Render email template with OTP
            email_subject = "Verify Your Sign-up"
            email_body = render_to_string('otp_email.html', {'otp': verification_code, 'email': data['email']})

            # Send HTML email
            email = EmailMultiAlternatives(
                subject=email_subject,
                body="Your verification code is: " + verification_code,  # Plain text fallback
                from_email='djangoproject24@gmail.com',
                to=[data['email']]
            )
            email.attach_alternative(email_body, "text/html")
            email.send()

            return Response({"message": "OTP sent successfully. Check your email."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            entered_otp = serializer.validated_data['otp']
            stored_otp = request.session.get('verification_code')

            if entered_otp == stored_otp:
                email = request.session.get('email')
                password = request.session.get('password')
                username = request.session.get('username')

                if not (email and password and username):
                    return Response({"error": "Invalid session data. Please retry."}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    new_user = CustomUser.objects.create_user(
                        username=username, email=email, password=password, user_type='student'
                    )

                    student_group, _ = Group.objects.get_or_create(name='Student')
                    student_group.user_set.add(new_user)

                    return Response({"message": "Verification successful. You can log in now."}, status=status.HTTP_200_OK)

                except Exception as e:
                    return Response({"error": f"Failed to create user: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"error": "Invalid OTP. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_tokens_for_user(user):
    """Generate JWT token pair for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            user = authenticate(request, username=username, password=password)

            if user:
                tokens = get_tokens_for_user(user)
                return Response({
                    "message": "Login successful",
                    "tokens": tokens
                }, status=status.HTTP_200_OK)

            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

