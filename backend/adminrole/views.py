from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import StudentDataEntrySerializer
from authentication.permissions import IsRector, IsWarden
from rest_framework.permissions import IsAuthenticated
from .models  import SelectDates
from rest_framework_simplejwt.authentication import JWTAuthentication

# class PendingStudentsView(APIView):
#     """Handles listing and verifying/rejecting pending students."""

#     def get(self, request):
#         """Return students with verified=None (pending verification)."""
#         pending_students = StudentDataEntry.objects.filter(verified=None)
#         serializer = StudentDataEntrySerializer(pending_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify (True) or Reject (False) a student by roll_no."""
#         roll_no = request.data.get('roll_no')
#         verified = request.data.get('verified')  # Expecting True or False

#         if verified not in [True, False]:
#             return Response({"error": "Invalid value for 'verified' (must be True or False)."},
#                             status=status.HTTP_400_BAD_REQUEST)

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
#             student.verified = verified
#             student.save()
#             return Response({"message": "Student status updated successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

# class VerifiedStudentsView(APIView):
#     """Handles listing and rejecting verified students."""

#     def get(self, request):
#         """Return students who are verified (verified=True)."""
#         verified_students = StudentDataEntry.objects.filter(verified=True)
#         serializer = StudentDataEntrySerializer(verified_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Reject a verified student (set verified=False) by roll_no."""
#         roll_no = request.data.get('roll_no')

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
#             student.verified = False
#             student.save()
#             return Response({"message": "Student rejected successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

# class RejectedStudentsView(APIView):
#     """Handles listing and verifying rejected students."""

#     def get(self, request):
#         """Return students who are rejected (verified=False)."""
#         rejected_students = StudentDataEntry.objects.filter(verified=False)
#         serializer = StudentDataEntrySerializer(rejected_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify a rejected student (set verified=True) by roll_no."""
#         roll_no = request.data.get('roll_no')

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
#             student.verified = True
#             student.save()
#             return Response({"message": "Student verified successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not rejected."}, status=status.HTTP_404_NOT_FOUND)


class setDatesView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request):
        # Get the year parameter from the request, default to first_year
        year_param = request.query_params.get('year', 'first_year')
        
        # Normalize the year parameter (convert "First Year" to "first_year")
        normalized_year = year_param.lower().replace(" ", "_")
        
        # Fetching the dates from database for the specified year
        dates = SelectDates.objects.filter(year=normalized_year)
        
        # Create a response dictionary
        date_dict = {
            'registrationStart': '',
            'registrationEnd': '',
            'resultDeclaration': '',
            'roommakingStart': '',
            'roommakingEnd': '',
            'finalAllotment': '',
            'verificationStart': '',
            'verificationEnd': ''
        }
        
        # Process each date record
        for date_obj in dates:
            if date_obj.event == 'Registration':
                date_dict['registrationStart'] = date_obj.start_date.isoformat() if date_obj.start_date else ''
                date_dict['registrationEnd'] = date_obj.end_date.isoformat() if date_obj.end_date else ''
            elif date_obj.event == 'Result Declaration':
                date_dict['resultDeclaration'] = date_obj.start_date.isoformat() if date_obj.start_date else ''
            elif date_obj.event == 'Roommaking':
                date_dict['roommakingStart'] = date_obj.start_date.isoformat() if date_obj.start_date else ''
                date_dict['roommakingEnd'] = date_obj.end_date.isoformat() if date_obj.end_date else ''
            elif date_obj.event == 'Final Allotment':
                date_dict['finalAllotment'] = date_obj.start_date.isoformat() if date_obj.start_date else ''
            elif date_obj.event == 'Verification':
                date_dict['verificationStart'] = date_obj.start_date.isoformat() if date_obj.start_date else ''
                date_dict['verificationEnd'] = date_obj.end_date.isoformat() if date_obj.end_date else ''
        
        return Response(date_dict)
    
    # Event ID mapping
    event_id_map = {
        "Registration": 1,
        "Result Declaration": 2,
        "Roommaking": 3,
        "Final Allotment": 4,
        "Verification": 5
    }

    def post(self, request):
        data = request.data
        print(data)  # For debugging purposes
        
        # Extract the year from the request data
        year = data.get('year', 'first_year')  # Default to first_year if not provided
        dates_data = data.get('dates', data)  # If the data is nested, get the 'dates' field, otherwise use the whole data
        
        # Group dates by their event types
        event_buffer = {}
        
        # Map frontend keys to events and their date types
        key_mapping = {
            'registrationStart': ('Registration', 'start_date'),
            'registrationEnd': ('Registration', 'end_date'),
            'resultDeclaration': ('Result Declaration', 'both_dates'),  # Use both for single date events
            'roommakingStart': ('Roommaking', 'start_date'),
            'roommakingEnd': ('Roommaking', 'end_date'),
            'finalAllotment': ('Final Allotment', 'both_dates'),  # Use both for single date events
            'verificationStart': ('Verification', 'start_date'),
            'verificationEnd': ('Verification', 'end_date')
        }
        
        # Process each key in the request data
        for key, date_str in dates_data.items():
            if key in key_mapping:
                event_name, date_type = key_mapping[key]
                
                # Initialize event in buffer if not already present
                if event_name not in event_buffer:
                    event_buffer[event_name] = {}
                
                # Parse the date string
                try:
                    parsed_date = datetime.strptime(date_str, "%Y-%m-%dT%H:%M")
                    date_only = parsed_date.date()
                except ValueError:
                    try:
                        # Try alternate format if the first one fails
                        parsed_date = datetime.strptime(date_str, "%Y-%m-%d")
                        date_only = parsed_date.date()
                    except ValueError:
                        return Response(
                            {"error": f"Invalid date format for '{key}': '{date_str}'"},
                            status=400
                        )
                
                # Store in buffer
                if date_type == 'both_dates':
                    # For single-date events, store the same date as both start and end
                    event_buffer[event_name]['start_date'] = date_only
                    event_buffer[event_name]['end_date'] = date_only
                else:
                    event_buffer[event_name][date_type] = date_only
        
        # Save to the database
        for event, dates in event_buffer.items():
            # Get existing record if any for this year
            try:
                event_obj = SelectDates.objects.get(event=event, year=year)
                # Update only the provided dates
                if 'start_date' in dates:
                    event_obj.start_date = dates['start_date']
                if 'end_date' in dates:
                    event_obj.end_date = dates['end_date']
                event_obj.save()
            except SelectDates.DoesNotExist:
                # Create new record with default values
                defaults = {
                    'event_id': self.event_id_map.get(event, 0),
                    'year': year,
                    'start_date': dates.get('start_date'),
                    'end_date': dates.get('end_date', dates.get('start_date'))  # Default end date to start date if not provided
                }
                
                # Only create if we have at least a start date
                if defaults['start_date']:
                    SelectDates.objects.create(
                        event=event,
                        **{k: v for k, v in defaults.items() if v is not None}
                    )
        
        return Response({"status": f"Dates for {year.replace('_', ' ').title()} updated successfully!"})

# class setDatesView(APIView):
#     permission_classes=[IsAuthenticated]
#     def get(self,request):
#         #fetching the dates from database 
#         dates=SelectDates.objects.all().values('event_id','event','start_date','end_date')
#     #mapping the dates for the dictionary in frontend 
#         date_dict={
#             'registrationStart': dates.filter(event='Registration Start').first().start_date.isoformat() if dates.filter(event='Registration Start').exists() else '',
#                 'registrationEnd': dates.filter(event='Registration End').first().end_date.isoformat() if dates.filter(event='Registration End').exists() else '',
#                 'resultDeclaration': dates.filter(event='Result Declaration').first().start_date.isoformat() if dates.filter(event='Result Declaration').exists() else '',
#                 'roommakingStart': dates.filter(event='Room Making Start').first().start_date.isoformat() if dates.filter(event='Room Making Start').exists() else '',
#                 'roommakingEnd': dates.filter(event='Room Making End').first().end_date.isoformat() if dates.filter(event='Room Making End').exists() else '',
#                 'finalAllotment': dates.filter(event='Final Allotment').first().start_date.isoformat() if dates.filter(event='Final Allotment').exists() else '',
#                 'verificationStart': dates.filter(event='Verification Start').first().start_date.isoformat() if dates.filter(event='Verification Start').exists() else '',
#                 'verificationEnd': dates.filter(event='Verification End').first().end_date.isoformat() if dates.filter(event='Verification End').exists() else '',
#         }
#         return Response(date_dict)
#     def post(self,request):
#         #save the dates or set new dates 
#         data=request.data
#         print("printing the data like ",data)
#         return Response({"message": "Dates saved successfully"}, status=200)
#         #FOR TESTING 
#         for event_key, date_value in data.items():
#             if date_value:  # Only update if a date is provided
#                 event_name = event_key.replace('_', ' ').title()
#                 obj, created = SelectDates.objects.update_or_create(
#                     event=event_name,
#                     defaults={
#                         'start_date': date_value if 'Start' in event_name or 'Declaration' in event_name or 'Allotment' in event_name else None,
#                         'end_date': date_value if 'End' in event_name else None
#                     }
#                 



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import StudentDataEntrySerializer, StudentDetailSerializer
from authentication.permissions import IsRector, IsWarden
from rest_framework.permissions import IsAuthenticated
from .models import SelectDates
from rest_framework_simplejwt.authentication import JWTAuthentication

# class PendingStudentsView(APIView):
#     """Handles listing and verifying/rejecting pending students."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsRector]

#     def get(self, request):
#         """Return students with verified=None (pending verification)."""
#         pending_students = StudentDataEntry.objects.filter(verified=None)
#         serializer = StudentDataEntrySerializer(pending_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify (True) or Reject (False) a student by roll_no."""
#         roll_no = request.data.get('roll_no')
#         verified = request.data.get('verified')  # Expecting True or False
#         reason = request.data.get('reason')  # Optional rejection reason

#         if verified not in [True, False]:
#             return Response({"error": "Invalid value for 'verified' (must be True or False)."},
#                             status=status.HTTP_400_BAD_REQUEST)

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
#             student.verified = verified
#             # If we want to store rejection reasons, we would need to add a field to the model
#             # student.rejection_reason = reason if not verified and reason else None
#             student.save()
#             return Response({"message": "Student status updated successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

# class VerifiedStudentsView(APIView):
#     """Handles listing and rejecting verified students."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsRector]

#     def get(self, request):
#         """Return students who are verified (verified=True)."""
#         verified_students = StudentDataEntry.objects.filter(verified=True)
#         serializer = StudentDataEntrySerializer(verified_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Reject a verified student (set verified=False) by roll_no."""
#         roll_no = request.data.get('roll_no')
#         reason = request.data.get('reason')  # Optional rejection reason

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
#             student.verified = False
#             # If we want to store rejection reasons, we would need to add a field to the model
#             # student.rejection_reason = reason if reason else None
#             student.save()
#             return Response({"message": "Student rejected successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

# class RejectedStudentsView(APIView):
#     """Handles listing and verifying rejected students."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsRector]

#     def get(self, request):
#         """Return students who are rejected (verified=False)."""
#         rejected_students = StudentDataEntry.objects.filter(verified=False)
#         serializer = StudentDataEntrySerializer(rejected_students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     def post(self, request):
#         """Verify a rejected student (set verified=True) by roll_no."""
#         roll_no = request.data.get('roll_no')

#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
#             student.verified = True
#             # If we have a rejection_reason field, clear it
#             # student.rejection_reason = None
#             student.save()
#             return Response({"message": "Student verified successfully."}, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found or not rejected."}, status=status.HTTP_404_NOT_FOUND)

# class StudentDetailView(APIView):
#     """Handles retrieving detailed information for a specific student."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsRector]

#     def get(self, request, roll_no):
#         """Return detailed information for a specific student."""
#         try:
#             student = StudentDataEntry.objects.get(roll_no=roll_no)
#             serializer = StudentDetailSerializer(student)
#             return Response(serializer.data, status=status.HTTP_200_OK)
#         except StudentDataEntry.DoesNotExist:
#             return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

# class StudentsByYearView(APIView):
#     """Handles listing students filtered by year."""
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated, IsRector]

#     def get(self, request, year):
#         """Return students filtered by year (class_name)."""
#         if year not in dict(StudentDataEntry.CLASS_CHOICES).keys():
#             return Response({"error": "Invalid year."}, status=status.HTTP_400_BAD_REQUEST)
            
#         students = StudentDataEntry.objects.filter(class_name=year)
#         serializer = StudentDataEntrySerializer(students, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

class PendingStudentsView(APIView):
    """Handles listing and verifying/rejecting pending students."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        """Return students with verified=None (pending verification)."""
        pending_students = StudentDataEntry.objects.filter(verified=None)
        
        # Get optional year filter from query params
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            pending_students = pending_students.filter(class_name=year)
            
        serializer = StudentDataEntrySerializer(pending_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify (True) or Reject (False) a student by roll_no."""
        roll_no = request.data.get('roll_no')
        verified = request.data.get('verified')  # Expecting True or False
        reason = request.data.get('reason')  # Optional rejection reason

        if verified not in [True, False]:
            return Response({"error": "Invalid value for 'verified' (must be True or False)."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
            student.verified = verified
            # If we want to store rejection reasons, we would need to add a field to the model
            # student.rejection_reason = reason if not verified and reason else None
            student.save()
            return Response({"message": "Student status updated successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

class VerifiedStudentsView(APIView):
    """Handles listing and rejecting verified students."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        """Return students who are verified (verified=True)."""
        verified_students = StudentDataEntry.objects.filter(verified=True)
        
        # Get optional year filter from query params
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            verified_students = verified_students.filter(class_name=year)
            
        serializer = StudentDataEntrySerializer(verified_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Reject a verified student (set verified=False) by roll_no."""
        roll_no = request.data.get('roll_no')
        reason = request.data.get('reason')  # Optional rejection reason

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
            student.verified = False
            # If we want to store rejection reasons, we would need to add a field to the model
            # student.rejection_reason = reason if reason else None
            student.save()
            return Response({"message": "Student rejected successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

class RejectedStudentsView(APIView):
    """Handles listing and verifying rejected students."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request):
        """Return students who are rejected (verified=False)."""
        rejected_students = StudentDataEntry.objects.filter(verified=False)
        
        # Get optional year filter from query params
        year = request.query_params.get('class_name')
        if year and year in dict(StudentDataEntry.CLASS_CHOICES).keys():
            rejected_students = rejected_students.filter(class_name=year)
            
        serializer = StudentDataEntrySerializer(rejected_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify a rejected student (set verified=True) by roll_no."""
        roll_no = request.data.get('roll_no')

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
            student.verified = True
            # If we have a rejection_reason field, clear it
            # student.rejection_reason = None
            student.save()
            return Response({"message": "Student verified successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or not rejected."}, status=status.HTTP_404_NOT_FOUND)

class StudentDetailView(APIView):
    """Handles retrieving detailed information for a specific student."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request, roll_no):
        """Return detailed information for a specific student."""
        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no)
            serializer = StudentDetailSerializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

class StudentsByYearView(APIView):
    """Handles listing students filtered by year."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsRector]

    def get(self, request, year):
        """Return students filtered by year (class_name)."""
        if year not in dict(StudentDataEntry.CLASS_CHOICES).keys():
            return Response({"error": "Invalid year."}, status=status.HTTP_400_BAD_REQUEST)
            
        students = StudentDataEntry.objects.filter(class_name=year)
        serializer = StudentDataEntrySerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)