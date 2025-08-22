from django.core.management.base import BaseCommand
from restaurants.models import Table


class Command(BaseCommand):
    help = 'Regenerate QR codes for all tables with correct production URLs'

    def handle(self, *args, **options):
        self.stdout.write('Starting QR code regeneration...')
        
        tables = Table.objects.all()
        updated_count = 0
        
        for table in tables:
            try:
                # Force regenerate QR code
                if table.qr_code:
                    # Delete old QR code file
                    table.qr_code.delete(save=False)
                
                # Generate new QR code with correct URL
                table.generate_qr_code()
                table.save(update_fields=['qr_code'])
                updated_count += 1
                
                self.stdout.write(f'✅ Regenerated QR for Table {table.number} ({table.restaurant.name})')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Failed to regenerate QR for Table {table.number}: {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Successfully regenerated {updated_count} QR codes!')
        )
