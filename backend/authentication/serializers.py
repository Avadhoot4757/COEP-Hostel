from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from .models import *

# serializers.py
from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from .models import StudentDataEntry, Branch, AdmissionCategory, Caste

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['branch']

class AdmissionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionCategory
        fields = ['admission_category']

class CasteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caste
        fields = ['caste']

class StudentDataEntrySerializer(serializers.ModelSerializer):
    branch = serializers.CharField()
    admission_category = serializers.CharField()
    caste = serializers.CharField()

    class Meta:
        model = StudentDataEntry
        fields = '__all__'
        read_only_fields = ['user', 'verified']

    def validate_rank(self, data):
        class_name = data.get('class_name')
        rank = data.get('rank')
        cgpa = data.get('cgpa')

        if class_name == 'fy':
            if rank is None:
                raise serializers.ValidationError({"rank": "Rank is required for First Year students."})
            if cgpa is not None:
                raise serializers.ValidationError({"cgpa": "CGPA should not be provided for First Year students."})
        else:
            if cgpa is None:
                raise serializers.ValidationError({"cgpa": "CGPA is required for non-First Year students."})
            if rank is not None:
                raise serializers.ValidationError({"rank": "Rank should not be provided for non-First Year students."})

        return data

    def validate_roll_no(self, value):
        user = self.context['request'].user
        if value != user.username:
            raise serializers.ValidationError("Roll number must match your username.")
        # Basic format validation
        class_name = self.initial_data.get('class_name')
        if class_name == 'fy':
            if not (value.startswith('CET') or value.startswith('JEE')):
                raise serializers.ValidationError(
                    "Roll number for First Year must be a CET or JEE number (e.g., CET123456 or JEE789012)."
                )
        else:
            if not value.startswith('MIS') and not value.isnumeric():
                raise serializers.ValidationError(
                    "Roll number for non-First Year must be an MIS number (e.g., MIS2023001)."
                )
        return value

    def validate_entrance_exam(self, value):
        class_name = self.initial_data.get('class_name')
        if class_name == 'fy' and not value:
            raise serializers.ValidationError("Entrance exam is required for First Year students.")
        if class_name in ['sy', 'ty', 'btech'] and value:
            raise serializers.ValidationError("Entrance exam must be null for non-First Year students.")
        return value

    def validate_branch(self, value):
        try:
            branch = Branch.objects.get(branch=value)
            return branch
        except Branch.DoesNotExist:
            raise serializers.ValidationError("Invalid branch.")

    def validate_admission_category(self, value):
        try:
            category = AdmissionCategory.objects.get(admission_category=value)
            return category
        except AdmissionCategory.DoesNotExist:
            raise serializers.ValidationError("Invalid admission category.")

    def validate_caste(self, value):
        try:
            caste = Caste.objects.get(caste=value)
            return caste
        except Caste.DoesNotExist:
            raise serializers.ValidationError("Invalid caste.")

    def validate(self, data):
        # Conditional file requirements
        caste = data.get('caste')
        if caste:
            if caste.caste not in ['OPEN', 'EWS']:
                if not data.get('caste_certificate'):
                    raise serializers.ValidationError({"caste_certificate": "Caste certificate is required."})
                if not data.get('caste_validity_certificate'):
                    raise serializers.ValidationError({"caste_validity_certificate": "Caste validity certificate is required."})
            if caste.caste == 'EWS' and not data.get('ews_certificate'):
                raise serializers.ValidationError({"ews_certificate": "EWS certificate is required for EWS category."})
        if data.get('creamy_layer') and not data.get('non_creamy_layer_certificate'):
            raise serializers.ValidationError({"non_creamy_layer_certificate": "Non-creamy layer certificate is required."})
        if data.get('pwd') and not data.get('pwd_certificate'):
            raise serializers.ValidationError({"pwd_certificate": "PWD certificate is required."})
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

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
            student = StudentDataEntry.objects.get(roll_no=data['username'], year=data['year'])
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
