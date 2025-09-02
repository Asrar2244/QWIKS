# AWS S3 Setup Guide for QR Menu App
# This file contains instructions for setting up persistent file storage

"""
AWS S3 SETUP INSTRUCTIONS
==========================

Your images and QR codes are getting lost because Render uses ephemeral storage.
To fix this, you need to set up AWS S3 for persistent file storage.

STEP 1: Create AWS S3 Bucket
---------------------------
1. Go to AWS Console: https://console.aws.amazon.com/
2. Navigate to S3 service
3. Click "Create bucket"
4. Choose a unique bucket name (e.g., "qwiks-menu-media")
5. Select your preferred region (e.g., us-east-1)
6. Keep default settings for now
7. Click "Create bucket"

STEP 2: Create IAM User
-----------------------
1. Go to IAM service in AWS Console
2. Click "Users" → "Create user"
3. Name: "qwiks-s3-user"
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach policies directly"
7. Search for "S3" and select "AmazonS3FullAccess"
8. Click "Next: Tags" → "Next: Review" → "Create user"
9. IMPORTANT: Save the Access Key ID and Secret Access Key

STEP 3: Configure Render Environment Variables
---------------------------------------------
In your Render dashboard, go to your backend service and add these environment variables:

AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_STORAGE_BUCKET_NAME=your_bucket_name_here
AWS_S3_REGION_NAME=us-east-1

STEP 4: Make S3 Bucket Public (for images to be accessible)
---------------------------------------------------------
1. Go to your S3 bucket
2. Click "Permissions" tab
3. Under "Block public access", click "Edit"
4. Uncheck "Block all public access"
5. Save changes
6. Go to "Bucket policy" and add this policy:

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}

Replace "your-bucket-name" with your actual bucket name.

STEP 5: Deploy
-------------
After setting the environment variables, Render will automatically redeploy.
Your images and QR codes will now persist across restarts!

COST ESTIMATE
-------------
- S3 Standard Storage: ~$0.023 per GB per month
- Data Transfer: ~$0.09 per GB (outbound)
- For a typical restaurant app: ~$1-5/month

ALTERNATIVE: Quick Fix (Temporary)
---------------------------------
If you don't want to set up AWS S3 right now, you can:
1. Re-upload images after each restart
2. Use a different hosting service with persistent storage
3. Accept that images will be lost on restarts

The AWS S3 setup is recommended for production use.
