from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from .models import StudentMain, StudentDataEntry, Branch, AdmissionCategory, Caste

class StudentDataEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDataEntry
        fields = '__all__'  # Includes all fields from the model

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = '__all__'

class AdmissionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionCategory
        fields = '__all__'

class CasteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caste
        fields = '__all__'


class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    year = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match!"})

        try:
            student = StudentMain.objects.get(roll_no=data['username'], year=data['year'])
            if student.year == 'FirstYear':
                if student.personal_mail != data['email']: 
                    raise serializers.ValidationError({"student": "Student details don't match with database!"})
            else:
                if student.college_mail != data['email']:
                    raise serializers.ValidationError({"student": "Student details don't match with database!"})
        except ObjectDoesNotExist:
            raise serializers.ValidationError({"student": "Student details don't match with database!"})

        return data


class OTPVerificationSerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6)
    token = serializers.CharField(required=True)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match!"})
        return data
