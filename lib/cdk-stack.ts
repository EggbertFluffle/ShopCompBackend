import { Construct } from 'constructs'

import { Duration } from 'aws-cdk-lib'
import * as cdk from 'aws-cdk-lib'
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'

import * as path from 'node:path'

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = ec2.Vpc.fromVpcAttributes(this, 'VPC', {
			vpcId: 'vpc-012ef413bdad2fbf2',                                                                         // Replace with your VPC ID
			availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],                                          // Replace with your AZs
			privateSubnetIds: ['subnet-0f390a967b85975a0', 'subnet-0358acf2a66397e84', 'subnet-0b35307b2d17b3f21'], // Replace with your private subnet IDs
		})

		const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-016eb5203ee701fb7', {             // Find your security group
			mutable: false
		})

		// NOTE: You First have to add RDS_USER and RDS_PASSWORD to 
		// your environment variables for your account. Same with RDS_DATABASE and RDS_HOST
		const rdsUser     = process.env.RDS_USER!
		const rdsPassword = process.env.RDS_PASSWORD!
		const rdsDatabase = process.env.RDS_DATABASE! // Is this supposed to be the "DB Identifier"
		const rdsHost     = process.env.RDS_HOST!

		// generic default handler for any API function that doesn't get its own Lambda method
		const default_fn = new lambdaNodejs.NodejsFunction(this, 'LambdaDefaultFunction', {
			runtime: lambda.Runtime.NODEJS_22_X,
			handler: 'handler.handler',
			code: lambda.Code.fromAsset(path.join(__dirname, 'default')),
			vpc: vpc,                                                             // Reference the VPC defined above
			securityGroups: [securityGroup],                                      // Associate the security group
			timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
		})

		const api_endpoint = new apigw.LambdaRestApi(this, `shopcomp`, {
			handler: default_fn,
			restApiName: `ShopCompAPI`, 
			proxy: false,
			defaultCorsPreflightOptions: {                                        // Optional BUT very helpful: Add CORS configuration 
				allowOrigins: apigw.Cors.ALL_ORIGINS,
				allowMethods: apigw.Cors.ALL_METHODS,
				allowHeaders: apigw.Cors.DEFAULT_HEADERS,
			},
		})

		// Create a resource (e.g., '/calc')
		const shopcompResource = api_endpoint.root.addResource('shopcomp')
		const testResource = shopcompResource.addResource('test')

		// https://github.com/aws/aws-cdk/blob/main/packages/aws-cdk-lib/aws-apigateway/README.md
		const integration_parameters = {
			proxy: false,
			passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,

			integrationResponses: [
				{
					// Successful response from the Lambda function, no filter defined
					statusCode: '200',
					responseTemplates: {
						'application/json': '$input.json(\'$\')',       // should just pass JSON through untouched
					},
					responseParameters: {
						'method.response.header.Content-Type':                      "'application/json'",
						'method.response.header.Access-Control-Allow-Origin':       "'*'",
						'method.response.header.Access-Control-Allow-Credentials':  "'true'"
					},
				},
				{
					// For errors, we check if the error message is not empty, get the error data
					selectionPattern: '(\n|.)+',
					statusCode: "400",
					responseTemplates: {
						'application/json': JSON.stringify({ state: 'error', message: "$util.escapeJavaScript($input.path('$.errorMessage'))" })
					},
					responseParameters: {
						'method.response.header.Content-Type':                      "'application/json'",
						'method.response.header.Access-Control-Allow-Origin':       "'*'",
						'method.response.header.Access-Control-Allow-Credentials':  "'true'"
					},
				}
			]
		}

		const response_parameters = {
			methodResponses: [
				{
					// Successful response from the integration
					statusCode: '200',
					// Define what parameters 
					responseParameters: {
						'method.response.header.Content-Type': true,
						'method.response.header.Access-Control-Allow-Origin': true,
						'method.response.header.Access-Control-Allow-Credentials': true
					},

				},
				{
					// Same thing for the error responses
					statusCode: '400',
					responseParameters: {
						'method.response.header.Content-Type': true,
						'method.response.header.Access-Control-Allow-Origin': true,
						'method.response.header.Access-Control-Allow-Credentials': true
					},

				}
			]
		}

		// Path parameter specific configurations - use proxy integration for path parameters
		const path_parameter_integration = {
			proxy: true
		}

		const path_response_parameters = {
			methodResponses: [
				{
					statusCode: '200',
					responseParameters: {
						'method.response.header.Content-Type': true,
						'method.response.header.Access-Control-Allow-Origin': true,
						'method.response.header.Access-Control-Allow-Credentials': true
					}
				},
				{
					statusCode: '400',
					responseParameters: {
						'method.response.header.Content-Type': true,
						'method.response.header.Access-Control-Allow-Origin': true,
						'method.response.header.Access-Control-Allow-Credentials': true
					}
				}
			]
		}

		// Add a POST method to the '/shopcomp/test' resource
		const test_fn = new lambdaNodejs.NodejsFunction(this, 'TestFunction', {
		  runtime: lambda.Runtime.NODEJS_22_X,
		  handler: 'handler.handler',
		  code: lambda.Code.fromAsset(path.join(__dirname, 'test')),
		  vpc: vpc,                                                             // Reference the VPC defined above
		  environment: {
		      RDS_USER: rdsUser,
		      RDS_PASSWORD: rdsPassword,
		      RDS_DATABASE: rdsDatabase,
		      RDS_HOST: rdsHost
		    },
		  securityGroups: [securityGroup],                                      // Associate the security group
		  timeout: Duration.seconds(3),                                         // Example timeout, adjust as needed
		})
		testResource.addMethod('POST', new apigw.LambdaIntegration(test_fn, integration_parameters), response_parameters)
	}
}
