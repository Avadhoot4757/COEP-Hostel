import random
from django.conf import settings
import uuid
from django.contrib.auth.models import Group
from django.utils.timezone import now
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from authentication.permissions import *
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from .serializers import *
from .models import *
from datetime import datetime   
from datetime import timedelta   
from django.core.cache import cache
from django.utils.timezone import now
from rest_framework.response import Response
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
import random, uuid
from rest_framework.parsers import FormParser, MultiPartParser
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import IntegrityError, connection
import time
import socket
from urllib3.exceptions import TimeoutError
from requests.exceptions import ConnectionError as RequestsConnectionError
CustomUser = get_user_model()
from django.db import OperationalError, transaction


CLASS_CHOICES = [
    ("fy", "First Year"),
    ("sy", "Second Year"),
    ("ty", "Third Year"),
    ("btech", "Final Year"),
]

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class CurrentUser(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'class_name': user.class_name
        })

class AdmissionCategoryView(APIView):
    permission_classes = []

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        elif self.request.method in ['POST', 'DELETE']:
            return [IsStaffUser()]
        return [IsAuthenticated()]

    def get(self, request):
        categories = AdmissionCategory.objects.all()
        serializer = AdmissionCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AdmissionCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            category = AdmissionCategory.objects.get(admission_category=pk)
            category.delete()
            return Response({"message": "Admission category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except AdmissionCategory.DoesNotExist:
            return Response({"error": "Admission category not found"}, status=status.HTTP_404_NOT_FOUND)


class BranchView(APIView):
    permission_classes = []

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        elif self.request.method in ['POST', 'PUT', 'DELETE']:
            return [IsStaffUser()]
        return [IsAuthenticated()]

    def get(self, request):
        year = request.query_params.get('year')
        if not year:
            return Response({"error": "Year parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        if year not in [choice[0] for choice in CLASS_CHOICES]:
            return Response({"error": "Invalid year value"}, status=status.HTTP_400_BAD_REQUEST)

        branches = Branch.objects.filter(year=year)
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BranchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        year = request.query_params.get('year')
        if not year:
            return Response({"error": "Year parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            branch = Branch.objects.get(branch=pk, year=year)
            serializer = BranchSerializer(branch, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Branch.DoesNotExist:
            return Response({"error": "Branch not found for the given year"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        year = request.query_params.get('year')
        if not year:
            return Response({"error": "Year parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            branch = Branch.objects.get(branch=pk, year=year)
            branch.delete()
            return Response({"message": "Branch deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Branch.DoesNotExist:
            return Response({"error": "Branch not found for the given year"}, status=status.HTTP_404_NOT_FOUND)


class CasteView(APIView):
    permission_classes = []

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        elif self.request.method in ['POST', 'PUT', 'DELETE']:
            return [IsStaffUser()]
        return [IsAuthenticated()]

    def get(self, request):
        year = request.query_params.get('year')
        if not year:
            return Response({"error": "Year parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        if year not in [choice[0] for choice in CLASS_CHOICES]:
            return Response({"error": "Invalid year value"}, status=status.HTTP_400_BAD_REQUEST)

        castes = Caste.objects.filter(year=year)
        serializer = CasteSerializer(castes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CasteSerializer(data=request.data)
        if serializer.is_valid():
            year = serializer.validated_data['year']
            new_percentage = serializer.validated_data['seat_matrix_percentage']
            current_total = sum(c.seat_matrix_percentage for c in Caste.objects.filter(year=year) if c.seat_matrix_percentage)
            if current_total + new_percentage > 100:
                return Response({"error": "Total percentage cannot exceed 100% for the given year"}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        year = request.query_params.get('year')
        if not year:
            return Response({"error": "Year parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            caste = Caste.objects.get(caste=pk, year=year)
            serializer = CasteSerializer(caste, data=request.data, partial=True)
            if serializer.is_valid():
                new_percentage = serializer.validated_data.get('seat_matrix_percentage', caste.seat_matrix_percentage)
                current_total = sum(c.seat_matrix_percentage for c in Caste.objects.filter(year=year) if c.seat_matrix_percentage and c != caste)
                if current_total + new_percentage > 100:
                    return Response({"error": "Total percentage cannot exceed 100% for the given year"}, status=status.HTTP_400_BAD_REQUEST)
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Caste.DoesNotExist:
            return Response({"error": "Caste not found for the given year"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        year = request.query_params.get('year')
        if not year:
            return Response({"error": "Year parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            caste = Caste.objects.get(caste=pk, year=year)
            caste.delete()
            return Response({"message": "Caste deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Caste.DoesNotExist:
            return Response({"error": "Caste not found for the given year"}, status=status.HTTP_404_NOT_FOUND)


class StudentDataEntryView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        # Check if user has submitted a form
        try:
            entry = StudentDataEntry.objects.get(user=request.user)
            serializer = StudentDataEntrySerializer(entry)
            return Response({
                "message": "Form already submitted",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"message": "No form submitted yet"}, status=status.HTTP_200_OK)

    def post(self, request):
        # Prevent multiple submissions
        if StudentDataEntry.objects.filter(user=request.user).exists():
            return Response(
                {"error": "You have already submitted an application form."},
                status=status.HTTP_400_BAD_REQUEST
            )
        print(request.data)
        serializer = StudentDataEntrySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Application submitted successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SignupAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            verification_code = ''.join(random.choices('0123456789', k=6))
            token = uuid.uuid4().hex

            # Store OTP and user data in cache with expiry (10 minutes)
            cache.set(
                token,
                {
                    'otp': verification_code,
                    'email': data['email'],
                    'username': data['username'],
                    'password': data['password'],
                    'year': data['year'],
                    'timestamp': now().isoformat(),
                },
                timeout=600,
            )

            # Render email template with OTP
            email_subject = "Verify Your Sign-up"
            email_body = render_to_string('otp_email.html', {'otp': verification_code, 'email': data['email']})

            # Send HTML email
            email = EmailMultiAlternatives(
                subject=email_subject,
                body="Your verification code is: " + verification_code,
                from_email='djangoproject24@gmail.com',
                to=[data['email']],
            )
            email.attach_alternative(email_body, "text/html")
            email.send()

            return Response(
                {"message": "OTP sent successfully. Check your email.", "token": token},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            entered_otp = serializer.validated_data['otp']
            token = serializer.validated_data['token']

            # Retrieve data from cache
            stored_data = cache.get(token)
            if not stored_data:
                return Response(
                    {"error": "OTP expired or invalid. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            stored_otp = stored_data['otp']
            timestamp = stored_data['timestamp']

            # Check OTP expiration
            if now() - datetime.fromisoformat(timestamp) > timedelta(minutes=10):
                cache.delete(token)
                return Response(
                    {"error": "OTP expired. Request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

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

                    # Generate tokens upon successful signup
                    tokens = get_tokens_for_user(new_user)
                    cache.delete(token)  # Remove used token

                    response = Response(
                        {
                            "message": "Verification successful. You can log in now.",
                            "access_token": tokens['access'],
                            "refresh_token": tokens['refresh'],
                            "user": {
                                "username": new_user.username,
                                "user_type": new_user.user_type,
                                "class_name": new_user.class_name,
                            },
                        },
                        status=status.HTTP_200_OK,
                    )

                    # Set tokens in cookies
                    response.set_cookie(
                        key='access_token',
                        value=tokens['access'],
                        httponly=True,
                        secure=True,
                        samesite='None',
                        max_age=3600,  # 1 hour
                    )
                    response.set_cookie(
                        key='refresh_token',
                        value=tokens['refresh'],
                        httponly=True,
                        secure=True,
                        samesite='None',
                        max_age=7 * 24 * 3600,  # 7 days
                    )

                    return response

                except Exception as e:
                    return Response(
                        {"error": f"Failed to create user: {str(e)}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            return Response(
                {"error": "Invalid OTP. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
                response = Response(
                    {
                        "message": "Login successful",
                        "user": {
                            "username": user.username,
                            "user_type":user.user_type,
                            "class_name":user.class_name,
                        },
                    },
                    status=status.HTTP_200_OK,
                )

                # Set HttpOnly cookies
                response.set_cookie(
                    key='access_token',
                    value=tokens['access'],
                    httponly=True,
                    secure=True,
                    samesite='None',
                    max_age=3600,  # 1 hour
                )
                response.set_cookie(
                    key='refresh_token',
                    value=tokens['refresh'],
                    httponly=True,
                    secure=True,
                    samesite='None',
                    max_age=7 * 24 * 3600,  # 7 days
                )

                return response

            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get refresh token from cookie
            refresh_token = request.COOKIES.get('refresh_token')
            
            if refresh_token:
                # Blacklist the refresh token to invalidate it
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Create response
            response = Response(
                {"message": "Logout successful"},
                status=status.HTTP_200_OK
            )
            
            # Clear the access_token and refresh_token cookies
            response.delete_cookie(
                key='access_token',
                path='/',
                domain=None
            )
            response.delete_cookie(
                key='refresh_token',
                path='/',
                domain=None
            )
            
            return response
            
        except Exception as e:
            return Response(
                {"error": f"Logout failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class RequestPasswordResetAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']

            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User with this email does not exist"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Generate password reset token
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            # Construct password reset link
            reset_link = request.build_absolute_uri(
                reverse("password_reset_confirm", kwargs={"uidb64": uid, "token": token})
            )

            # Send email with reset link
            send_mail(
                subject="Password Reset Request",
                message=f"Click the link below to reset your password:\n{reset_link}",
                from_email="djangoproject24@gmail.com",
                recipient_list=[user.email],
                fail_silently=False,
            )

            return Response(
                {"message": "Password reset link sent successfully."},
                status=status.HTTP_200_OK,
            )

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
                    return Response(
                        {"error": "Invalid or expired token"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Set new password
                user.set_password(new_password)
                user.save()

                return Response(
                    {"message": "Password reset successfully."},
                    status=status.HTTP_200_OK,
                )

            except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
                return Response(
                    {"error": "Invalid request"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # Get refresh token from cookie
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        
        if not refresh_token:
            return Response({"detail": "Refresh token not found in cookies"}, 
                            status=status.HTTP_401_UNAUTHORIZED)
            
        # Set the token in the request data
        request.data['refresh'] = refresh_token
        
        # Call the parent class's post method
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Set the new access token as a cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=response.data['access'],
                max_age=60 * 60,  # 1 hour
                httponly=True,
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            
            # Remove the tokens from the response body for added security
            if 'access' in response.data:
                del response.data['access']
            if 'refresh' in response.data:
                del response.data['refresh']
                
        return response
    

class StudentDataVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsManager]
    BATCH_SIZE = 100
    BATCH_DELAY = 0.5
    RETRY_LIMIT = 3

    def get(self, request):
        students = StudentDataVerification.objects.all()
        serializer = StudentDataVerificationSerializer(students, many=True)
        return Response(serializer.data)

    def post(self, request):

        data = request.data
        if not isinstance(data, list):
            data = [data]
        successful = []

        def is_network_error(exc):
            return isinstance(exc, (socket.timeout,
                                RequestsConnectionError,
                                TimeoutError,
                                ConnectionError,
                                OperationalError))

        # Process data in batches
        for i in range(0, len(data), self.BATCH_SIZE):
            batch = data[i:i + self.BATCH_SIZE]
            serializer = StudentDataVerificationSerializer(data=batch, many=True)
            if not serializer.is_valid():
                print(f"Batch {i} to {i+self.BATCH_SIZE} invalid: {serializer.errors}")
                # Instead of skipping, try to process valid items individually
                valid_data = [item for item in batch if StudentDataVerificationSerializer(data=item).is_valid()]
                if not valid_data:
                    continue
                serializer = StudentDataVerificationSerializer(data=valid_data, many=True)
                if not serializer.is_valid():
                    continue  # Skip if still invalid

            retries = 0
            while retries < self.RETRY_LIMIT:
                try:
                    with transaction.atomic():
                        instances = serializer.save()
                    
                    # Collect successful instances
                    for instance in instances:
                        successful.append(StudentDataVerificationSerializer(instance).data)
                    break  # Exit retry loop on success
                    
                except IntegrityError as e:
                    print(f"Integrity error in batch {i}: {str(e)}")
                    # Handle individual records to isolate failures
                    for item in batch:
                        try:
                            item_serializer = StudentDataVerificationSerializer(data=item)
                            if item_serializer.is_valid():
                                with transaction.atomic():
                                    instance = item_serializer.save()
                                successful.append(StudentDataVerificationSerializer(instance).data)
                        except Exception:
                            continue  # Skip failed item
                    break
                    
                except Exception as e:
                    if is_network_error(e):
                        retries += 1
                        print(f"Network error on batch {i} (retry {retries}): {str(e)}")
                        time.sleep(0.2)
                        connection.close()  # Reset DB connection
                    else:
                        print(f"Non-network error on batch {i}: {str(e)}")
                        break  # Exit retry loop for non-network errors
            
            time.sleep(self.BATCH_DELAY)
        
        return Response({"successful": successful}, status=status.HTTP_201_CREATED)