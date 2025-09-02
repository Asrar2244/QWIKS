from django.core.management.base import BaseCommand
from restaurants.models import Table


class Command(BaseCommand):
    help = 'Regenerate all missing QR codes for tables'

    def handle(self, *args, **options):
        tables = Table.objects.all()
        regenerated_count = 0
        
        for table in tables:
            if not table.qr_code or not table.qr_code.url:
                self.stdout.write(f"🔄 Regenerating QR code for Table {table.number} - {table.restaurant.name}")
                table.generate_qr_code()
                table.save(update_fields=['qr_code'])
                regenerated_count += 1
            else:
                self.stdout.write(f"✅ QR code exists for Table {table.number} - {table.restaurant.name}")
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully regenerated {regenerated_count} QR codes')
        )
