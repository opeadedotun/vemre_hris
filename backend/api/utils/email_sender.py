from django.core.mail import EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_email_with_attachment(subject, body, to_email, attachment_content=None, attachment_filename=None, attachment_mimetype='application/pdf'):
    """
    Utility function to send an email with an optional attachment.
    """
    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        
        if attachment_content and attachment_filename:
            email.attach(attachment_filename, attachment_content, attachment_mimetype)
        
        email.send(fail_silently=False)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False
