require('dotenv').config();
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

// Configure AWS SES Client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function sendTestEmail() {
  const params = {
    Source: process.env.FROM_EMAIL, // Must be verified in SES
    Destination: {
      ToAddresses: [process.env.TO_EMAIL],
    },
    Message: {
      Subject: {
        Data: 'SES Test Email',
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: 'This is a test email sent from AWS SES using Node.js!',
          Charset: 'UTF-8',
        },
        Html: {
          Data: `
            <html>
              <body>
                <h1>SES Test Email</h1>
                <p>This is a test email sent from AWS SES using Node.js!</p>
                <p>If you're seeing this, your SES setup is working correctly.</p>
              </body>
            </html>
          `,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log('Email sent successfully!');
    console.log('Message ID:', response.MessageId);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Run the test
sendTestEmail()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error.message);
    process.exit(1);
  });
