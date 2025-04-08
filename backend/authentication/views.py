import random
from django.contrib.auth.models import Group
from django.utils.timezone import now
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
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from .serializers import SignupSerializer, OTPVerificationSerializer, LoginSerializer  
from .serializers import StudentDataEntrySerializer, PasswordResetSerializer, PasswordResetConfirmSerializer
from .models import StudentDataEntry
from datetime import datetime   
from datetime import timedelta   
from django.core.cache import cache
from django.utils.timezone import now
from rest_framework.response import Response
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
import random, uuid

CustomUser = get_user_model()


class StudentDataEntryView(APIView):
    def post(self, request):
        serializer = StudentDataEntrySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Student entry created successfully!", "data": serializer.data}, 
                            status=status.HTTP_201_CREATED)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class SignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            verification_code = ''.join(random.choices('0123456789', k=6))
            token = uuid.uuid4().hex  # Generate unique token
            
            # Store OTP and user data in cache with expiry (10 minutes)
            cache.set(token, {
                'otp': verification_code,
                'email': data['email'],
                'username': data['username'],
                'password': data['password'],
                'year': data['year'],
                'timestamp': now().isoformat()
            }, timeout=600)
            
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

            return Response({"message": "OTP sent successfully. Check your email.", "token": token}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        print("hi\n")
        if serializer.is_valid():
            print("hi2\n")
            entered_otp = serializer.validated_data['otp']
            token = serializer.validated_data['token']
            print(entered_otp + " " + token)
            # Retrieve data from cache
            stored_data = cache.get(token)
            if not stored_data:
                print("hi")
                return Response({"error": "OTP expired or invalid. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
            
            stored_otp = stored_data['otp']
            timestamp = stored_data['timestamp']
            
            # Check OTP expiration
            if now() - datetime.fromisoformat(timestamp) > timedelta(minutes=10):
                print("hi2")
                cache.delete(token)
                return Response({"error": "OTP expired. Request a new one."}, status=status.HTTP_400_BAD_REQUEST)
            
            print(stored_otp)
            if entered_otp == stored_otp:
                email = stored_data['email']
                password = stored_data['password']
                username = stored_data['username']
                
                try:
                    new_user = CustomUser.objects.create_user(
                        username=username, email=email, password=password, user_type='student'
                    )

                    student_group, _ = Group.objects.get_or_create(name='Student')
                    student_group.user_set.add(new_user)
                    
                    cache.delete(token)  # Remove used token
                    return Response({"message": "Verification successful. You can log in now."}, status=status.HTTP_200_OK)
                
                except Exception as e:
                    print("on\n")
                    return Response({"error": f"Failed to create user: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
            print("oh\n")
            return Response({"error": "Invalid OTP. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_tokens_for_user(user):
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


class RequestPasswordResetAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']

            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response({"error": "User with this email does not exist"}, status=status.HTTP_404_NOT_FOUND)

            # Generate password reset token
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            # Construct password reset link
            reset_link = request.build_absolute_uri(
                reverse("password-reset-confirm", kwargs={"uidb64": uid, "token": token})
            )

            # Send email with reset link
            send_mail(
                subject="Password Reset Request",
                message=f"Click the link below to reset your password:\n{reset_link}",
                from_email="djangoproject24@gmail.com",
                recipient_list=[user.email],
                fail_silently=False,
            )

            return Response({"message": "Password reset link sent successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            new_password = serializer.validated_data['new_password']

            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = CustomUser.objects.get(pk=uid)

                # Validate token
                if not default_token_generator.check_token(user, token):
                    return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

                # Set new password
                user.set_password(new_password)
                user.save()

                return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)

            except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
                return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

