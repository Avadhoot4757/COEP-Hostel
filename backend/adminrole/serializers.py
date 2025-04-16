from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from authentication.models import StudentDataEntry

class StudentDataEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDataEntry
        fields = '__all__'

from rest_framework import serializers
from authentication.models import StudentDataEntry, Branch, AdmissionCategory, Caste

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name']

class AdmissionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionCategory
        fields = ['id', 'name']

class CasteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caste
        fields = ['id', 'name']

class StudentDataEntrySerializer(serializers.ModelSerializer):
    """Serializer for basic student information in list views."""
    branch = BranchSerializer(read_only=True)
    admission_category = AdmissionCategorySerializer(read_only=True)
    caste = CasteSerializer(read_only=True)
    
    class Meta:
        model = StudentDataEntry
        fields = [
            'roll_no', 'first_name', 'middle_name', 'last_name',
            'class_name', 'branch', 'admission_category', 'caste',
            'verified'
        ]

class StudentDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed student information."""
    branch = BranchSerializer(read_only=True)
    admission_category = AdmissionCategorySerializer(read_only=True)
    caste = CasteSerializer(read_only=True)
    
    class Meta:
        model = StudentDataEntry
        fields = '__all__'
        
    def to_representation(self, instance):
        """Add full URLs for file fields."""
        representation = super().to_representation(instance)
        request = self.context.get('request')
        
        # Add full URLs for file fields if they exist
        file_fields = [
            'application_form', 'hostel_no_dues', 'mess_no_dues',
            'address_proof', 'caste_validity_certificate', 'income_certificate',
            'caste_certificate', 'ews_certificate', 'pwd_certificate',
            'admission_confirmation_letter', 'college_fee_receipt',
            'non_creamy_layer_certificate'
        ]
        
        if request:
            for field in file_fields:
                if representation[field]:
                    representation[field] = request.build_absolute_uri(representation[field])
                    
        return representation
