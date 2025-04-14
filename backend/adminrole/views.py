from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from authentication.models import StudentDataEntry
from .serializers import StudentDataEntrySerializer
from authentication.permissions import IsRector, IsWarden
from rest_framework.permissions import IsAuthenticated
from .models  import SelectDates
from rest_framework_simplejwt.authentication import JWTAuthentication

class PendingStudentsView(APIView):
    """Handles listing and verifying/rejecting pending students."""

    def get(self, request):
        """Return students with verified=None (pending verification)."""
        pending_students = StudentDataEntry.objects.filter(verified=None)
        serializer = StudentDataEntrySerializer(pending_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify (True) or Reject (False) a student by roll_no."""
        roll_no = request.data.get('roll_no')
        verified = request.data.get('verified')  # Expecting True or False

        if verified not in [True, False]:
            return Response({"error": "Invalid value for 'verified' (must be True or False)."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=None)
            student.verified = verified
            student.save()
            return Response({"message": "Student status updated successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or already processed."}, status=status.HTTP_404_NOT_FOUND)

class VerifiedStudentsView(APIView):
    """Handles listing and rejecting verified students."""

    def get(self, request):
        """Return students who are verified (verified=True)."""
        verified_students = StudentDataEntry.objects.filter(verified=True)
        serializer = StudentDataEntrySerializer(verified_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Reject a verified student (set verified=False) by roll_no."""
        roll_no = request.data.get('roll_no')

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=True)
            student.verified = False
            student.save()
            return Response({"message": "Student rejected successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or not verified."}, status=status.HTTP_404_NOT_FOUND)

class RejectedStudentsView(APIView):
    """Handles listing and verifying rejected students."""

    def get(self, request):
        """Return students who are rejected (verified=False)."""
        rejected_students = StudentDataEntry.objects.filter(verified=False)
        serializer = StudentDataEntrySerializer(rejected_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Verify a rejected student (set verified=True) by roll_no."""
        roll_no = request.data.get('roll_no')

        try:
            student = StudentDataEntry.objects.get(roll_no=roll_no, verified=False)
            student.verified = True
            student.save()
            return Response({"message": "Student verified successfully."}, status=status.HTTP_200_OK)
        except StudentDataEntry.DoesNotExist:
            return Response({"error": "Student not found or not rejected."}, status=status.HTTP_404_NOT_FOUND)

class setDatesView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self, request):
        # Fetching the dates from database as model instances
        dates = SelectDates.objects.all()
        
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
    giveid = {
        "Registration": 1,
        "Result Declaration": 2,
        "Roommaking": 3,
        "Final Allotment": 4,
        "Verification": 5
    }

    def post(self, request):
        data = request.data
        print(data)  # For debugging purposes
        
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
        for key, date_str in data.items():
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
        event_id_map = {
            "Registration": 1,
            "Result Declaration": 2,
            "Roommaking": 3,
            "Final Allotment": 4,
            "Verification": 5
        }
        
        for event, dates in event_buffer.items():
            # Get existing record if any
            try:
                event_obj = SelectDates.objects.get(event=event)
                # Update only the provided dates
                if 'start_date' in dates:
                    event_obj.start_date = dates['start_date']
                if 'end_date' in dates:
                    event_obj.end_date = dates['end_date']
                event_obj.save()
            except SelectDates.DoesNotExist:
                # Create new record with default values
                defaults = {
                    'event_id': event_id_map.get(event, 0),
                    'start_date': dates.get('start_date'),
                    'end_date': dates.get('end_date', dates.get('start_date'))  # Default end date to start date if not provided
                }
                
                # Only create if we have at least a start date
                if defaults['start_date']:
                    SelectDates.objects.create(
                        event=event,
                        **{k: v for k, v in defaults.items() if v is not None}
                    )
        
        return Response({"status": "Dates updated successfully!"})
            
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
#                 )
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SelectDates
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SetDatesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Fetch all dates from the database and format them for the frontend"""
        try:
            # Fetch all date records
            dates = SelectDates.objects.all().order_by('event_id').values('event_id', 'event', 'start_date', 'end_date')
            
            # Create mapping between database event names and frontend keys
            event_mapping = {
                'Registrationstart': 'registrationStart',
                'Registrationend': 'registrationEnd',
                'Resultdeclaration': 'resultDeclaration',
                'Roommakingstart': 'roommakingStart',
                'Roommakingend': 'roommakingEnd',
                'Finalallotment': 'finalAllotment',
                'Verificationstart': 'verificationStart',
                'Verificationend': 'verificationEnd',
            }
            
            # Build response dictionary
            date_dict = {
                'registrationStart': '',
                'registrationEnd': '',
                'resultDeclaration': '',
                'roommakingStart': '',
                'roommakingEnd': '',
                'finalAllotment': '',
                'verificationStart': '',
                'verificationEnd': '',
            }
            
            # Map database records to frontend keys
            for record in dates:
                event_name = record['event']
                frontend_key = event_mapping.get(event_name)
                
                if frontend_key:
                    if frontend_key.endswith('Start') and record['start_date']:
                        date_dict[frontend_key] = record['start_date'].isoformat()
                    elif frontend_key.endswith('End') and record['end_date']:
                        date_dict[frontend_key] = record['end_date'].isoformat()
                    elif record['start_date']:  # For single-date events (like resultDeclaration)
                        date_dict[frontend_key] = record['start_date'].isoformat()
            
            return Response(date_dict)
            
        except Exception as e:
            logger.error(f"Error fetching dates: {str(e)}")
            return Response({"error": "Failed to fetch dates"}, status=500)
    
    def post(self, request):
        """Save the dates submitted from the frontend"""
        try:
            data = request.data
            print(data)
            logger.info(f"Received date data: {data}")
            
            # Define the expected event records with their correct IDs from database
            event_data = {
                'Registrationstart': {
                    'event_id': 5,
                    'field': 'start_date',
                    'value': data.get('registrationStart', None)
                },
                'Registrationend': {
                    'event_id': 6,
                    'field': 'end_date',
                    'value': data.get('registrationEnd', None)
                },
                'Resultdeclaration': {
                    'event_id': 7,
                    'field': 'start_date',
                    'value': data.get('resultDeclaration', None)
                },
                'Roommakingstart': {
                    'event_id': 8,
                    'field': 'start_date',
                    'value': data.get('roommakingStart', None)
                },
                # Add remaining events with their correct IDs
                'Roommakingend': {
                    'event_id': 9,  # Assuming this ID based on pattern
                    'field': 'end_date',
                    'value': data.get('roommakingEnd', None)
                },
                'Finalallotment': {
                    'event_id': 10,  # Assuming this ID based on pattern
                    'field': 'start_date',
                    'value': data.get('finalAllotment', None)
                },
                'Verificationstart': {
                    'event_id': 11,  # Assuming this ID based on pattern
                    'field': 'start_date',
                    'value': data.get('verificationStart', None)
                },
                'Verificationend': {
                    'event_id': 12,  # Assuming this ID based on pattern
                    'field': 'end_date',
                    'value': data.get('verificationEnd', None)
                }
            }
            
            # Process each event
            updated_count = 0
            for event_name, info in event_data.items():
                if not info['value']:
                    continue
                    
                # Convert string to datetime if needed
                date_value = info['value']
                if isinstance(date_value, str):
                    try:
                        date_obj = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
                    except ValueError:
                        logger.error(f"Invalid date format for {event_name}: {date_value}")
                        continue
                else:
                    date_obj = date_value
                
                # Prepare fields to update
                defaults = {
                    'event': event_name,  # Ensure event name is set
                }
                
                # Set the appropriate date field
                if info['field'] == 'start_date':
                    defaults['start_date'] = date_obj
                else:
                    defaults['end_date'] = date_obj
                
                # Update or create record
                obj, created = SelectDates.objects.update_or_create(
                    event_id=info['event_id'],
                    defaults=defaults
                )
                
                updated_count += 1
                action = "Created" if created else "Updated"
                logger.info(f"{action} date record for {event_name} with ID {info['event_id']}: {defaults}")
            
            # Get the updated dates to return to the frontend
            updated_dates = self.get(request).data
            
            # Include success notification in response
            return Response({
                "message": f"Successfully updated {updated_count} date{'s' if updated_count != 1 else ''}",
                "dates": updated_dates
            }, status=200)
            
        except Exception as e:
            logger.error(f"Error saving dates: {str(e)}")
            return Response({"error": f"Failed to save dates: {str(e)}"}, status=500)