from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from authentication.models import StudentDataEntry

class StudentDataEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDataEntry
        fields = '__all__'
