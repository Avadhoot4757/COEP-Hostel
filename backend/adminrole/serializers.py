from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from authentication.models import *
from .models import *
from django.utils import timezone

class StudentDataEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDataEntry
        fields = '__all__'


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

class SelectDatesSerializer(serializers.ModelSerializer):
    years = serializers.ListField(
        child=serializers.ChoiceField(choices=SelectDates.YEAR_CHOICES),
        write_only=True,
        required=True,
        min_length=1,
        help_text="List of years to apply the dates to."
    )

    class Meta:
        model = SelectDates
        fields = ["event_id", "event", "start_date", "end_date", "years"]
        read_only_fields = ["event_id"]

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        event = data.get("event")
        years = data.get("years")
        today = timezone.now()

        if not start_date:
            raise serializers.ValidationError({"start_date": "Start date and time are required."})

        requires_end_date = event in ["Registration", "Student Data Verification", "Roommaking", "Verification"]
        if requires_end_date and not end_date:
            raise serializers.ValidationError({"end_date": f"End date and time are required for {event}."})

        if end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date and time must be on or after start date and time."}
            )

        instance = self.instance
        if instance and instance.start_date < today:
            if start_date != instance.start_date or end_date != instance.end_date:
                raise serializers.ValidationError(
                    {"start_date": "Cannot edit dates for past or ongoing events."}
                )
            if set(years) != {instance.year}:
                raise serializers.ValidationError(
                    {"years": "Cannot change years for past or ongoing events."}
                )

        if not instance and start_date < today:
            raise serializers.ValidationError(
                {"start_date": "Start date and time must be in the future."}
            )

        event_order = [
            "Registration",
            "Student Data Verification",
            "Result Declaration",
            "Roommaking",
            "Final Allotment",
            "Verification",
        ]
        current_idx = event_order.index(event)
        request_data = self.context.get("request").data if self.context.get("request") else []

        for item in request_data:
            if item.get("event") == event:
                continue
            item_idx = event_order.index(item.get("event", ""))
            item_start = item.get("start_date")
            item_end = item.get("end_date")

            if not (item_start and (item_end if event_order[item_idx] in ["Registration", "Student Data Verification", "Roommaking", "Verification"] else True)):
                continue

            try:
                item_start_dt = timezone.datetime.fromisoformat(item_start.replace("Z", "+00:00"))
                item_end_dt = timezone.datetime.fromisoformat(item_end.replace("Z", "+00:00")) if item_end else item_start_dt
            except (ValueError, TypeError):
                continue

            if item_idx < current_idx and item_end_dt > start_date:
                raise serializers.ValidationError(
                    {
                        "start_date": f"Start date for {event} must be on or after end date of {item['event']} ({item_end_dt})."
                    }
                )

            if requires_end_date and item_idx > current_idx and end_date > item_start_dt:
                raise serializers.ValidationError(
                    {
                        "end_date": f"End date for {event} must be on or before start date of {item['event']} ({item_start_dt})."
                    }
                )

        return data

    def create(self, validated_data):
        years = validated_data.pop("years")
        event = validated_data["event"]
        event_id_map = {
            "Registration": 1,
            "Student Data Verification": 2,
            "Result Declaration": 3,
            "Roommaking": 4,
            "Final Allotment": 5,
            "Verification": 6,
        }
        base_event_id = event_id_map[event]
        year_offset = {
            "fy": 0,
            "sy": 10,
            "ty": 20,
            "btech": 30,
        }
        instances = []

        for year in years:
            event_id = base_event_id + year_offset[year]
            instance, created = SelectDates.objects.update_or_create(
                event_id=event_id,
                year=year,
                defaults={
                    "event": event,
                    "start_date": validated_data["start_date"],
                    "end_date": validated_data.get("end_date"),
                },
            )
            instances.append(instance)

        return instances[0]

    def to_representation(self, instance):
        """Ensure GET response matches expected format."""
        return {
            "event_id": instance.event_id,
            "event": instance.event,
            "start_date": instance.start_date.isoformat(),
            "end_date": instance.end_date.isoformat() if instance.end_date else None,
            "year": instance.year,
        }
