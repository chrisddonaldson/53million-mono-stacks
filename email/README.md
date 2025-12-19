# AWS SES Email Testing

A simple Node.js project to test your AWS SES (Simple Email Service) setup.

## Prerequisites

- AWS Account with SES enabled
- Verified email addresses in SES (both sender and recipient if in sandbox mode)
- AWS credentials (Access Key ID and Secret Access Key)

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your AWS credentials and email addresses:
   ```
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_REGION=us-east-1
   FROM_EMAIL=sender@example.com
   TO_EMAIL=recipient@example.com
   ```

3. Install dependencies (if not already done):
   ```bash
   npm install
   ```

## Running the Test

Send a test email:
```bash
node send-test-email.js
```

If successful, you should see:
```
Email sent successfully!
Message ID: <message-id>

Test completed successfully!
```

## Important Notes

- **SES Sandbox Mode**: If your AWS account is in SES sandbox mode, you can only send emails to verified email addresses. You need to verify both the sender and recipient emails in the AWS SES console.

- **Production Access**: To send emails to any address, request production access through the AWS SES console.

- **Region**: Make sure your AWS_REGION matches where you've set up and verified your SES configuration.

## Troubleshooting

- **Email not verified**: Verify your email addresses in AWS SES Console
- **Invalid credentials**: Check your AWS Access Key ID and Secret Access Key
- **Wrong region**: Ensure AWS_REGION matches your SES setup
- **Rate limits**: SES has sending limits based on your account status
