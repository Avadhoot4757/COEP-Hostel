from django.db import models

# Create your models here.
from django.db import models

from django.db import models

class SelectDates(models.Model):
    event_id = models.IntegerField()  # No longer unique on its own
    event = models.CharField(max_length=100)
    year = models.CharField(max_length=20, default="first_year")  # Stores year as first_year, second_year, etc.
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)  # Making end_date optional for single-date events
    
    def __str__(self):
        return f"{self.event} - {self.year} (ID: {self.event_id}, {self.start_date} - {self.end_date})"
    
    class Meta:
        ordering = ['year', 'event_id']
        unique_together = ['event_id', 'year']  # Ensure unique combination of event_id and year