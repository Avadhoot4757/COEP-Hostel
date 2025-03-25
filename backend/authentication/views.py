import random
from django.contrib.auth.models import User, Group
from django.core.mail import send_mail
from django.apps import apps
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import SignupSerializer, OTPVerificationSerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.exceptions import ObjectDoesNotExist
from .serializers import OTPVerificationSerializer

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

            # Send verification email
            send_mail(
                'Verification Code',
                f'Your verification code is: {verification_code}',
                'djangoproject24@gmail.com',
                [data['email']],
            )

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

