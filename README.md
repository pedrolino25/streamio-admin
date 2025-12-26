# Streamio Admin Panel

Admin panel for managing API keys and webhooks for the Media Processing Platform.

## Features

- ✅ **Project Management**
  - List all projects with API keys and webhook URLs
  - Create new projects (generates API keys automatically)
  - Delete projects
  - Copy API keys to clipboard
- ✅ **Testing Tools**
  - Upload Test - Test file uploads directly from the admin panel
  - Webhook Test - Test webhook endpoints with sample payloads
- ✅ **Modern UI**
  - Clean, modern interface
  - Responsive design

## Prerequisites

- Node.js 20+ and npm
- AWS account with access to DynamoDB, Cognito, and Lambda services
- **streamio-infra** - The AWS infrastructure must be deployed first (DynamoDB tables, Cognito pools, Lambda functions)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Ensure the **streamio-infra** infrastructure is deployed and configured in AWS.

3. Create a `.env.local` file with your AWS configuration:

```env
# Required: Cognito Authentication
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=region:identity-pool-id

# Required: AWS Configuration
NEXT_PUBLIC_AWS_REGION=eu-west-2
PROJECTS_TABLE=streamio-projects-prod

# Optional: AWS Credentials (if not using Cognito Identity Pool)
# NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your-access-key
# NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your-secret-key

# Optional: Upload Test Feature
NEXT_PUBLIC_UPLOAD_LAMBDA_FUNCTION_NAME=streamio-upload-url-prod
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

**Required:**

- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` - Cognito App Client ID
- `NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID` - Cognito Identity Pool ID
- `NEXT_PUBLIC_AWS_REGION` - AWS region (default: `eu-west-2`)
- `PROJECTS_TABLE` - DynamoDB table name for projects

**Optional:**

- `NEXT_PUBLIC_AWS_ACCESS_KEY_ID` - AWS access key (if not using Cognito Identity Pool)
- `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY` - AWS secret key (if not using Cognito Identity Pool)
- `NEXT_PUBLIC_UPLOAD_LAMBDA_FUNCTION_NAME` - Lambda function name for Upload Test feature

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter

## Testing Features

### Upload Test

Test file uploads directly from the admin panel:

1. Enter an API key for a project
2. Select a file to upload
3. Optionally specify a path prefix
4. Upload and view the results

**Note:** Requires `NEXT_PUBLIC_UPLOAD_LAMBDA_FUNCTION_NAME` to be configured.

### Webhook Test

Test webhook endpoints to verify they're working correctly:

1. Enter a webhook URL
2. Send a test request
3. View the response status and data

This helps ensure your webhooks are ready to receive processing notifications.
