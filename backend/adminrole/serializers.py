from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from authentication.models import *
from .models import *
from django.utils import timezone
from django.contrib.auth import get_user_model
User = get_user_model()

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
            'verified', 'gender'
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
        fields = ["event", "start_date", "end_date", "years"]
        read_only_fields = []

    def validate(self, data):
        start_date = data.get("start_date")
        end_date = data.get("end_date")
        today = timezone.now()

        if not start_date:
            raise serializers.ValidationError({"start_date": "Start date is required."})

        if end_date and end_date < start_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after start date."}
            )

        instance = self.instance
        if instance and instance.start_date < today:
            if start_date != instance.start_date or end_date != instance.end_date:
                raise serializers.ValidationError(
                    {"start_date": "Cannot edit dates for past or ongoing events."}
                )
            if set(data.get("years")) != {instance.year}:
                raise serializers.ValidationError(
                    {"years": "Cannot change years for past or ongoing events."}
                )

        if not instance and start_date < today:
            raise serializers.ValidationError(
                {"start_date": "Start date must be in the future."}
            )

        return data

    def create(self, validated_data):
        years = validated_data.pop("years")
        event = validated_data.get("event")  # This should now work since event is not read_only
        instances = []

        for year in years:
            instance, created = SelectDates.objects.update_or_create(
                event=event,
                year=year,
                defaults={
                    "start_date": validated_data["start_date"],
                    "end_date": validated_data.get("end_date"),
                },
            )
            instances.append(instance)

        return instances[0]

    def to_representation(self, instance):
        return {
            "event": instance.event,
            "start_date": instance.start_date.isoformat(),
            "end_date": instance.end_date.isoformat() if instance.end_date else None,
            "year": instance.year,
        }

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "user_type", "class_name"]

    def to_representation(self, instance):
        # Exclude class_name for non-students
        ret = super().to_representation(instance)
        if instance.user_type != "student":
            ret.pop("class_name", None)
        return ret

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=User.USER_TYPES)
    class_name = serializers.ChoiceField(
        choices=User.CLASS_CHOICES, required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "user_type", "class_name"]

    def validate(self, data):
        # Ensure class_name is only set for students
        if data.get("user_type") == "student":
            if not data.get("class_name"):
                raise serializers.ValidationError({"class_name": "Class name is required for students."})
        elif data.get("class_name"):
            raise serializers.ValidationError({"class_name": "Class name is only applicable for students."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            user_type=validated_data["user_type"],
            class_name=validated_data.get("class_name"),
        )
        return user


class ReservedSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservedSeat
        fields = ['id', 'goi_jk_seats', 'nri_fn_pio_gulf_seats']

class SeatMatrixSerializer(serializers.ModelSerializer):
    reserved_seats = ReservedSeatSerializer()

    class Meta:
        model = SeatMatrix
        fields = ['id', 'year', 'gender', 'total_seats', 'ews_seats', 'all_india_seats', 'branch_seats', 'reserved_seats']

    def create(self, validated_data):
        # Extract nested reserved_seats data
        reserved_seats_data = validated_data.pop('reserved_seats', None)
        if reserved_seats_data:
            reserved_seats = ReservedSeat.objects.create(**reserved_seats_data)
            validated_data['reserved_seats'] = reserved_seats
        return SeatMatrix.objects.create(**validated_data)

class BranchesRequestSerializer(serializers.Serializer):
    year = serializers.CharField()
    gender = serializers.CharField(default="male")

    def validate_year(self, value):
        valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
        if value not in valid_years:
            raise serializers.ValidationError(f"Invalid year. Must be one of: {', '.join(valid_years)}")
        return value

    def validate_gender(self, value):
        valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
        if value not in valid_genders:
            raise serializers.ValidationError(f"Invalid gender. Must be one of: {', '.join(valid_genders)}")
        return value

class BranchesResponseSerializer(serializers.Serializer):
    branches = serializers.ListField(child=serializers.CharField())

class StudentsRequestSerializer(serializers.Serializer):
    year = serializers.CharField()
    gender = serializers.CharField(default="male")
    branch = serializers.CharField()

    def validate_year(self, value):
        valid_years = [choice[0] for choice in StudentDataEntry.CLASS_CHOICES]
        if value not in valid_years:
            raise serializers.ValidationError(f"Invalid year. Must be one of: {', '.join(valid_years)}")
        return value

    def validate_gender(self, value):
        valid_genders = [choice[0] for choice in StudentDataEntry.GENDER_CHOICES]
        if value not in valid_genders:
            raise serializers.ValidationError(f"Invalid gender. Must be one of: {', '.join(valid_genders)}")
        return value

    def validate_branch(self, value):
        if not value:
            raise serializers.ValidationError("Branch is required.")
        return value

class StudentSerializer(serializers.Serializer):
    roll_no = serializers.CharField()
    name = serializers.CharField()
    admission_category = serializers.CharField()
    caste = serializers.CharField()
    cgpa = serializers.FloatField(allow_null=True)
    backlogs = serializers.IntegerField(allow_null=True)
    branch_rank = serializers.IntegerField()
    seat_alloted = serializers.CharField(allow_null=True)

class StudentsResponseSerializer(serializers.Serializer):
    students = StudentSerializer(many=True)
