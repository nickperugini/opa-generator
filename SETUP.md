# Setup Guide - OpenAI OPA Policy Generator

This guide will help you deploy your own instance of the OpenAI OPA Policy Generator.

## 📋 Prerequisites

### Required Tools
- **AWS CLI**: Configured with appropriate permissions
- **Node.js**: Version 18.x or later
- **npm**: Version 8.x or later
- **OpenAI API Key**: From OpenAI platform

### AWS Permissions Required
Your AWS user/role needs permissions for:
- CloudFormation (create/update/delete stacks)
- Lambda (create/update functions)
- API Gateway (create/manage APIs)
- S3 (create buckets, upload files)
- Secrets Manager (create/read secrets)
- IAM (create roles for Lambda)

## 🚀 Quick Deployment

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd openai-streaming-demo

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Deploy Backend Infrastructure
```bash
# Navigate to infrastructure directory
cd infrastructure

# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name openai-opa-generator \
  --template-body file://cloudformation.yaml \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Wait for stack creation (5-10 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name openai-opa-generator \
  --region us-east-1
```

### 3. Add OpenAI API Key
```bash
# Add your OpenAI API key to AWS Secrets Manager
aws secretsmanager put-secret-value \
  --secret-id openai-api-key \
  --secret-string "your-openai-api-key-here" \
  --region us-east-1
```

### 4. Deploy Lambda Function
```bash
# Navigate to Lambda directory
cd lambda

# Install dependencies
npm install

# Create deployment package
zip -r ../lambda-deployment.zip .

# Update Lambda function
aws lambda update-function-code \
  --function-name dev-openai-opa-generator \
  --zip-file fileb://../lambda-deployment.zip \
  --region us-east-1

cd ..
```

### 5. Create S3 Bucket for Frontend
```bash
# Create S3 bucket (use a unique name)
aws s3 mb s3://your-unique-bucket-name --region us-east-1

# Configure for static website hosting
aws s3 website s3://your-unique-bucket-name \
  --index-document index.html \
  --error-document index.html

# Disable block public access
aws s3api put-public-access-block \
  --bucket your-unique-bucket-name \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Apply public read policy
aws s3api put-bucket-policy \
  --bucket your-unique-bucket-name \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::your-unique-bucket-name/*"
      }
    ]
  }'
```

### 6. Update API Gateway CORS
```bash
# Get your API Gateway ID from CloudFormation outputs
API_ID=$(aws cloudformation describe-stacks \
  --stack-name openai-opa-generator \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiId`].OutputValue' \
  --output text \
  --region us-east-1)

# Update CORS to include your S3 bucket URL
aws apigatewayv2 update-api \
  --api-id $API_ID \
  --cors-configuration '{
    "AllowOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://your-unique-bucket-name.s3-website-us-east-1.amazonaws.com"
    ],
    "AllowMethods": ["GET", "POST", "OPTIONS"],
    "AllowHeaders": ["content-type", "x-amz-date", "authorization", "x-api-key"],
    "MaxAge": 300
  }' \
  --region us-east-1
```

### 7. Build and Deploy Frontend
```bash
# Navigate to frontend directory
cd frontend

# Build the application
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-unique-bucket-name --delete

# Your app is now live at:
echo "http://your-unique-bucket-name.s3-website-us-east-1.amazonaws.com"
```

## 🔧 Configuration

### Environment Variables
The Lambda function uses these environment variables (set automatically by CloudFormation):
- `OPENAI_SECRET_NAME`: Name of the secret in AWS Secrets Manager
- `AWS_REGION`: AWS region for the deployment

### Frontend Configuration
Update `frontend/src/services/api.ts` if you need to change the API base URL:
```typescript
const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';
```

## 🧪 Testing Your Deployment

### 1. Test API Health
```bash
# Get your API URL from CloudFormation
API_URL=$(aws cloudformation describe-stacks \
  --stack-name openai-opa-generator \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text \
  --region us-east-1)

# Test health endpoint
curl "$API_URL/health"
```

### 2. Test Policy Generation
```bash
# Test policy generation
curl -X POST "$API_URL/generate-policy" \
  -H "Content-Type: application/json" \
  -d '{"instructions": "Only allow if user role is admin"}'
```

### 3. Test Frontend
Visit your S3 website URL and try generating a policy through the UI.

## 🔄 Updates and Maintenance

### Update Lambda Function
```bash
cd infrastructure/lambda
npm install  # Install any new dependencies
zip -r ../lambda-deployment.zip .
aws lambda update-function-code \
  --function-name dev-openai-opa-generator \
  --zip-file fileb://../lambda-deployment.zip \
  --region us-east-1
```

### Update Frontend
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://your-unique-bucket-name --delete
```

### Update Infrastructure
```bash
cd infrastructure
aws cloudformation update-stack \
  --stack-name openai-opa-generator \
  --template-body file://cloudformation.yaml \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## 💰 Cost Optimization

### Monitor Usage
- Check CloudWatch logs for Lambda execution
- Monitor OpenAI API usage in OpenAI dashboard
- Review AWS billing for unexpected charges

### Cost-Saving Tips
- Use GPT-4o Mini (already configured) for cost efficiency
- Set up CloudWatch alarms for unusual API usage
- Consider implementing request caching for repeated queries

## 🔒 Security Best Practices

### API Key Security
- Never commit API keys to version control
- Rotate OpenAI API keys regularly
- Use AWS Secrets Manager for key storage

### Access Control
- Implement API rate limiting if needed
- Consider adding authentication for production use
- Monitor API access logs

### CORS Configuration
- Only allow necessary origins in CORS settings
- Remove localhost origins in production

## 🐛 Troubleshooting

### Common Issues

**Lambda Function Not Working:**
```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/dev-openai-opa-generator"
aws logs tail "/aws/lambda/dev-openai-opa-generator" --follow
```

**CORS Errors:**
- Ensure your S3 bucket URL is in the API Gateway CORS configuration
- Check that the API Gateway has been deployed after CORS changes

**OpenAI API Errors:**
- Verify API key is correctly stored in Secrets Manager
- Check OpenAI account has sufficient credits
- Review rate limits in OpenAI dashboard

**S3 Website Not Loading:**
- Ensure bucket policy allows public read access
- Check that static website hosting is enabled
- Verify index.html exists in bucket root

### Getting Help
- Check CloudWatch logs for detailed error messages
- Review AWS CloudFormation events for deployment issues
- Test individual components (Lambda, API Gateway, S3) separately

## 📊 Monitoring

### CloudWatch Metrics
Monitor these key metrics:
- Lambda function duration and errors
- API Gateway request count and latency
- S3 bucket requests and data transfer

### Alerts
Consider setting up alerts for:
- Lambda function errors
- High API Gateway latency
- Unusual OpenAI API costs

---

**Need help?** Check the troubleshooting section or review the AWS CloudWatch logs for detailed error information.
