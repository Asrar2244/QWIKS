from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings


class Command(BaseCommand):
    help = "Ensure a default superuser exists (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin')
        parser.add_argument('--email', default='admin@qwiks.com')
        parser.add_argument('--password', default='admin123')

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        email = options['email']
        password = options['password']

        try:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'is_staff': True,
                    'is_superuser': True,
                }
            )

            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f"Created superuser '{username}' with default password"))
            else:
                if not user.is_superuser or not user.is_staff:
                    user.is_superuser = True
                    user.is_staff = True
                    user.save()
                    self.stdout.write(self.style.WARNING(
                        f"Updated existing user '{username}' to superuser"))
                else:
                    self.stdout.write(self.style.SUCCESS(
                        f"Superuser '{username}' already exists"))

        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"Failed to ensure superuser: {exc}"))
            raise


