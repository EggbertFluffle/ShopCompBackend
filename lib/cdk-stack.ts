import { Construct } from "constructs";

import { Duration } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import * as path from "node:path";

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = ec2.Vpc.fromVpcAttributes(this, "VPC", {
			vpcId: "vpc-012ef413bdad2fbf2", // Replace with your VPC ID
			availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"], // Replace with your AZs
			privateSubnetIds: [
				"subnet-0f390a967b85975a0",
				"subnet-0358acf2a66397e84",
				"subnet-0b35307b2d17b3f21",
			], // Replace with your private subnet IDs
		});

		const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
			this,
			"SG",
			"sg-016eb5203ee701fb7",
			{
				// Find your security group
				mutable: false,
			}
		);

		// NOTE: You First have to add RDS_USER and RDS_PASSWORD to
		// your environment variables for your account. Same with RDS_DATABASE and RDS_HOST
		const rdsUser = process.env.RDS_USER!;
		const rdsPassword = process.env.RDS_PASSWORD!;
		const rdsDatabase = process.env.RDS_DATABASE!; // Is this supposed to be the "DB Identifier"
		const rdsHost = process.env.RDS_HOST!;

		// generic default handler for any API function that doesn't get its own Lambda method
		const default_fn = new lambdaNodejs.NodejsFunction(
			this,
			"LambdaDefaultFunction",
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: "handler.handler",
				code: lambda.Code.fromAsset(path.join(__dirname, "default")),
				vpc: vpc, // Reference the VPC defined above
				securityGroups: [securityGroup], // Associate the security group
				timeout: Duration.seconds(3), // Example timeout, adjust as needed
			}
		);

		const api_endpoint = new apigw.LambdaRestApi(this, `shopcomp`, {
			handler: default_fn,
			restApiName: `ShopCompAPI`,
			proxy: false,
			defaultCorsPreflightOptions: {
				// Optional BUT very helpful: Add CORS configuration
				allowOrigins: apigw.Cors.ALL_ORIGINS,
				allowMethods: apigw.Cors.ALL_METHODS,
				allowHeaders: apigw.Cors.DEFAULT_HEADERS,
			},
		});

		const loginShopperResource = api_endpoint.root.addResource("login-shopper");
		const registerShopperResource = api_endpoint.root.addResource("register-shopper");
		const submitReceiptResource = api_endpoint.root.addResource("submit-receipt");
        const addStoreResource = api_endpoint.root.addResource("add-store");
		const getStoreChainsResource = api_endpoint.root.addResource("get-store-chains");
		const reviewHistoryResource = api_endpoint.root.addResource("review-history");
		const loginAdminResource = api_endpoint.root.addResource( 'login-administrator');
        const listShoppingListsResource = api_endpoint.root.addResource( 'list-shopping-lists');
        const createShoppingListResource = api_endpoint.root.addResource( 'create-shopping-list');
        const addItemToShoppingListResource = api_endpoint.root.addResource( 'add-to-shopping-list');
        const removeItemFromShoppingListResource = api_endpoint.root.addResource( 'remove-from-shopping-list');
        const modifyItemOnShoppingListResource = api_endpoint.root.addResource( 'modify-on-shopping-list');
        const removeShoppingListResource = api_endpoint.root.addResource( 'remove-shopping-list');
        const modifyShoppingListResource = api_endpoint.root.addResource( 'modify-shopping-list');

		// https://github.com/aws/aws-cdk/blob/main/packages/aws-cdk-lib/aws-apigateway/README.md
		const integration_parameters = {
			proxy: false,
			passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_MATCH,

			integrationResponses: [
				{
					// Successful response from the Lambda function, no filter defined
					statusCode: "200",
					responseTemplates: {
						"application/json": "$input.json('$')", // should just pass JSON through untouched
					},
					responseParameters: {
						"method.response.header.Content-Type": "'application/json'",
						"method.response.header.Access-Control-Allow-Origin": "'*'",
						"method.response.header.Access-Control-Allow-Credentials": "'true'",
					},
				},
				{
					// For errors, we check if the error message is not empty, get the error data
					selectionPattern: "(\n|.)+",
					statusCode: "400",
					responseTemplates: {
						"application/json": JSON.stringify({
							state: "error",
							message: "$util.escapeJavaScript($input.path('$.errorMessage'))",
						}),
					},
					responseParameters: {
						"method.response.header.Content-Type": "'application/json'",
						"method.response.header.Access-Control-Allow-Origin": "'*'",
						"method.response.header.Access-Control-Allow-Credentials": "'true'",
					},
				},
			],
		};

		const response_parameters = {
			methodResponses: [
				{
					// Successful response from the integration
					statusCode: "200",
					// Define what parameters
					responseParameters: {
						"method.response.header.Content-Type": true,
						"method.response.header.Access-Control-Allow-Origin": true,
						"method.response.header.Access-Control-Allow-Credentials": true,
					},
				},
				{
					// Same thing for the error responses
					statusCode: "400",
					responseParameters: {
						"method.response.header.Content-Type": true,
						"method.response.header.Access-Control-Allow-Origin": true,
						"method.response.header.Access-Control-Allow-Credentials": true,
					},
				},
			],
		};

		// Path parameter specific configurations - use proxy integration for path parameters
		const path_parameter_integration = {
			proxy: true,
		};

		const path_response_parameters = {
			methodResponses: [
				{
					statusCode: "200",
					responseParameters: {
						"method.response.header.Content-Type": true,
						"method.response.header.Access-Control-Allow-Origin": true,
						"method.response.header.Access-Control-Allow-Credentials": true,
					},
				},
				{
					statusCode: "400",
					responseParameters: {
						"method.response.header.Content-Type": true,
						"method.response.header.Access-Control-Allow-Origin": true,
						"method.response.header.Access-Control-Allow-Credentials": true,
					},
				},
			],
		};

		// Add a POST method to the '/register-shopper' resource
		const login_shopper_fn = new lambdaNodejs.NodejsFunction(
			this,
			"LoginShopper",
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: "handler.handler",
				code: lambda.Code.fromAsset(path.join(__dirname, "login-shopper")),
				vpc: vpc, // Reference the VPC defined above
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup], // Associate the security group
				timeout: Duration.seconds(3), // Example timeout, adjust as needed
			}
		);
		loginShopperResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(login_shopper_fn, integration_parameters),
			response_parameters
		);

		// Add a POST method to the '/register-shopper' resource
		const register_shopper_fn = new lambdaNodejs.NodejsFunction(
			this,
			"RegisterShopper",
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: "handler.handler",
				code: lambda.Code.fromAsset(path.join(__dirname, "register-shopper")),
				vpc: vpc, // Reference the VPC defined above
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup], // Associate the security group
				timeout: Duration.seconds(3), // Example timeout, adjust as needed
			}
		);
		registerShopperResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(register_shopper_fn, integration_parameters),
			response_parameters
		);

		const submit_receipt_fn = new lambdaNodejs.NodejsFunction(
			this,
			"SubmitReceipt",
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: "handler.handler",
				code: lambda.Code.fromAsset(path.join(__dirname, "submit-receipt")),
				vpc: vpc, // Reference the VPC defined above
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup], // Associate the security group
				timeout: Duration.seconds(6), // Example timeout, adjust as needed
			}
		);
		submitReceiptResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(submit_receipt_fn, integration_parameters),
			response_parameters
		);

		const review_history_fn = new lambdaNodejs.NodejsFunction(
			this,
			"ReviewHistory",
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: "handler.handler",
				code: lambda.Code.fromAsset(path.join(__dirname, "review-history")),
				vpc: vpc, // Reference the VPC defined above
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup], // Associate the security group
				timeout: Duration.seconds(6), // Example timeout, adjust as needed
			}
		);
		reviewHistoryResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(review_history_fn, integration_parameters),
			response_parameters
		);

		const get_store_chains_fn = new lambdaNodejs.NodejsFunction(
			this,
			"GetStoreChains",
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "get-store-chains")
				),
				vpc: vpc, // Reference the VPC defined above
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup], // Associate the security group
				timeout: Duration.seconds(6), // Example timeout, adjust as needed
			}
		);
		getStoreChainsResource.addMethod(
			"GET",
			new apigw.LambdaIntegration(get_store_chains_fn, integration_parameters),
			response_parameters
		);



        // AddStore Lambda (no bundling, no Docker, same structure as other lambdas)
        const add_store_fn = new lambdaNodejs.NodejsFunction(this, "AddStore", {
            runtime: lambda.Runtime.NODEJS_22_X,
            handler: "handler.handler",                  // export const handler
            code: lambda.Code.fromAsset(path.join(__dirname, "add-store")),
            vpc,
            environment: {
                RDS_USER: rdsUser,
                RDS_PASSWORD: rdsPassword,
                RDS_DATABASE: rdsDatabase,
                RDS_HOST: rdsHost,
            },
            securityGroups: [securityGroup],
            timeout: Duration.seconds(3),
        });

        // POST /add-store
        addStoreResource.addMethod(
            "POST",
            new apigw.LambdaIntegration(add_store_fn, integration_parameters),
            response_parameters
        );


        const login_admin_fn = new lambdaNodejs.NodejsFunction(
			this,
			"LoginAdministrator",
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "login-administrator"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		loginAdminResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(login_admin_fn, integration_parameters),
			response_parameters,
		);

    const list_shopping_lists_fn = new lambdaNodejs.NodejsFunction(
      this,
      "ListShoppingLists",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "list-shopping-lists"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		listShoppingListsResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(list_shopping_lists_fn, integration_parameters),
			response_parameters,
		);

    const create_shopping_list_fn = new lambdaNodejs.NodejsFunction(
      this,
      "CreateShoppingList",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "create-shopping-list"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		createShoppingListResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(create_shopping_list_fn, integration_parameters),
			response_parameters,
		);

    const add_to_shopping_list_fn = new lambdaNodejs.NodejsFunction(
      this,
      "AddItemToShoppingList",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "add-to-shopping-list"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		addItemToShoppingListResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(add_to_shopping_list_fn, integration_parameters),
			response_parameters,
		);

    const remove_from_shopping_list_fn = new lambdaNodejs.NodejsFunction(
      this,
      "RemoveItemFromShoppingList",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "remove-from-shopping-list"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		removeItemFromShoppingListResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(remove_from_shopping_list_fn, integration_parameters),
			response_parameters,
		);

    const modify_on_shopping_list_fn = new lambdaNodejs.NodejsFunction(
      this,
      "ModifyItemOnShoppingList",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "modify-on-shopping-list"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		modifyItemOnShoppingListResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(modify_on_shopping_list_fn, integration_parameters),
			response_parameters,
		);

    const remove_shopping_list_fn = new lambdaNodejs.NodejsFunction(
      this,
      "RemoveShoppingList",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "remove-shopping-list"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		removeShoppingListResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(remove_shopping_list_fn, integration_parameters),
			response_parameters,
		);

    const modify_shopping_list_fn = new lambdaNodejs.NodejsFunction(
      this,
      "ModifyShoppingList",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "handler.handler",
				code: lambda.Code.fromAsset(
					path.join(__dirname, "modify-shopping-list"),
				),
				vpc,
				environment: {
					RDS_USER: rdsUser,
					RDS_PASSWORD: rdsPassword,
					RDS_DATABASE: rdsDatabase,
					RDS_HOST: rdsHost,
				},
				securityGroups: [securityGroup],
				timeout: Duration.seconds(3),
			},
		);
		modifyShoppingListResource.addMethod(
			"POST",
			new apigw.LambdaIntegration(modify_shopping_list_fn, integration_parameters),
			response_parameters,
		);

	}
}
