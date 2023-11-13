// import * as cdk from 'aws-cdk-lib';
import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
// import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dotenv from "dotenv";
dotenv.config()


if (!process.env.S3_BUCKET_NAME)
  throw new Error("Define S3_BUCKET_NAME in .env file")

if (!process.env.DISTRIBUTION_ID)
  throw new Error("Define DISTRIBUTION_ID in .env file")


export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "ReactShopAppBucket", {
      bucketName: process.env.S3_BUCKET_NAME || "react-shop-app-bucket",
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "react-app-OAI");
    const bucketPolicy = new iam.PolicyStatement({
      actions: ["S3:GetObject"],
      resources: [bucket.arnForObjects("*")],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    });

    bucket.addToResourcePolicy(bucketPolicy);

    const distribution = new cloudfront.CloudFrontWebDistribution(this, process.env.DISTRIBUTION_ID || "ReactShopAppDistribution", {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudfrontOAI
          },
          behaviors: [
            {
              isDefaultBehavior: true,
              defaultTtl: cdk.Duration.minutes(60)
            },
            {
              pathPattern: "/*",
              defaultTtl: cdk.Duration.seconds(0)
            },
          ]
        }
      ]
    });
    
  }

}
