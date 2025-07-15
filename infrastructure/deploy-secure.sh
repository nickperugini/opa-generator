#!/bin/bash

# Secure Deployment Script for OPA Policy Generator Agent
# This script prompts for the OpenAI API key securely

set -e

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="${ENVIRONMENT}-openai-opa-agent"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 OPA Policy Generator Agent - Secure Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo ""

# Validate AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if logged into AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: Not logged into AWS. Please run 'aws configure' or set AWS credentials${NC}"
    exit 1
fi

# Securely prompt for OpenAI API key
echo -e "${YELLOW}🔑 Please enter your OpenAI API key:${NC}"
echo -e "${YELLOW}   (Input will be hidden for security)${NC}"
read -s OPENAI_API_KEY
echo ""

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}❌ Error: OpenAI API key is required${NC}"
    exit 1
fi

# Validate API key format (basic check)
if [[ ! "$OPENAI_API_KEY" =~ ^sk-[a-zA-Z0-9]{48,}$ ]]; then
    echo -e "${YELLOW}⚠️  Warning: API key format doesn't match expected pattern${NC}"
    echo -e "${YELLOW}   Expected format: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx${NC}"
    echo -e "${YELLOW}   Continue anyway? (y/N)${NC}"
    read -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}📋 Step 1: Preparing Lambda function code${NC}"

# Navigate to lambda directory
cd lambda

# Install dependencies for main function
echo "Installing main function dependencies..."
npm install --production

# Setup MCP servers
echo "Setting up MCP servers..."
cd mcp-servers

# Install dependencies for each MCP server
for dir in */; do
    if [ -d "$dir" ]; then
        echo "Setting up MCP server: $dir"
        cd "$dir"
        
        # Install dependencies
        npm install --production
        cd ..
    fi
done

cd .. # Back to lambda directory

# Create deployment package
echo "Creating deployment package..."
zip -r function-agent.zip . -x \
    'node_modules/.cache/*' \
    '*.git*' \
    'test/*' \
    '*.log' \
    'coverage/*' \
    '.nyc_output/*' \
    'package-lock.json' \
    '*/package-lock.json'

cd .. # Back to infrastructure directory

echo -e "${YELLOW}📋 Step 2: Deploying CloudFormation stack${NC}"

# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file cloudformation-agent.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        OpenAIApiKey="$OPENAI_API_KEY" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"
else
    echo -e "${RED}❌ CloudFormation deployment failed${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 3: Updating Lambda function code${NC}"

# Get Lambda function name from CloudFormation output
FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text)

if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${RED}❌ Error: Could not retrieve Lambda function name${NC}"
    exit 1
fi

# Update Lambda function code
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://lambda/function-agent.zip \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lambda function code updated successfully${NC}"
else
    echo -e "${RED}❌ Lambda function code update failed${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Step 4: Testing deployment${NC}"

# Get API endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`APIEndpoint`].OutputValue' \
    --output text)

# Test health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "${API_ENDPOINT}/health" || echo "FAILED")

if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check response: $HEALTH_RESPONSE${NC}"
fi

echo -e "${YELLOW}📋 Step 5: Retrieving deployment information${NC}"

# Get Dashboard URL
DASHBOARD_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
    --output text)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Information:${NC}"
echo -e "Environment: ${ENVIRONMENT}"
echo -e "API Endpoint: ${API_ENDPOINT}"
echo -e "Lambda Function: ${FUNCTION_NAME}"
echo -e "Dashboard: ${DASHBOARD_URL}"
echo ""
echo -e "${BLUE}🔗 Available Endpoints:${NC}"
echo -e "Health Check: GET ${API_ENDPOINT}/health"
echo -e "Generate Policy: POST ${API_ENDPOINT}/generate-policy"
echo -e "Refine Policy: POST ${API_ENDPOINT}/refine-policy"
echo -e "Validate Policy: POST ${API_ENDPOINT}/validate-policy"
echo -e "Explain Policy: POST ${API_ENDPOINT}/explain-policy"
echo ""
echo -e "${BLUE}🧪 Test Commands:${NC}"
echo -e "curl ${API_ENDPOINT}/health"
echo ""
echo -e "curl -X POST ${API_ENDPOINT}/generate-policy \\"
echo -e "  -H \"Content-Type: application/json\" \\"
echo -e "  -d '{\"instructions\": \"Only allow admin users to access sensitive data\"}'"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo -e "1. Update your frontend configuration to use: ${API_ENDPOINT}"
echo -e "2. Test the new agent capabilities with the additional endpoints"
echo -e "3. Monitor the CloudWatch dashboard for performance metrics"
echo -e "4. Check CloudWatch logs for detailed agent operation logs"

# Cleanup
rm -f lambda/function-agent.zip

# Clear the API key from memory
unset OPENAI_API_KEY

echo -e "${GREEN}✨ Agent deployment complete!${NC}"
echo -e "${BLUE}🔒 API key has been securely stored in AWS Secrets Manager${NC}"
