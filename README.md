This node.js script writes .env files or export commands to stdout based on values held in Amazon Web Services (AWS) [Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html) and/or AWS [Secrets Manager](https://aws.amazon.com/secrets-manager/). Node applications can then be run using environment variables set by it, perhaps using package ["dotenv"](https://www.npmjs.com/package/dotenv) to retrieve from the .env file.

* Specify `--ssmpath` and/or `--secretid` to retrieve from AWS Parameter Store and/or AWS Secrets Manager respectively.
* For the Parameter Store, parameters are returned by path (e.g. parameters with names starting with an arbitrary path such as "/myapp/prodconfig")
* For authentication, you can specify `--accessKeyId=[awsAccessKeyId]` and `--secretAccessKey=[awsSecretAccessKey]`; or use an [AWS profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html) with `--profile=someprofile`; otherwise default AWS auth is used.

## SAMPLE USAGE: 

```sh
npm install -g "@phhu/aws-secrets-to-env"
```

```sh
# with global install
aws-secrets-to-env \
--ssmpath=/myapp/prodconfig \
--secretid=/myapp/prodconfig \
--region=eu-central-1 \
>.env && node myapp.js

eval $(node ./node_modules/@phhu/aws-secrets-to-env/aws-secrets-to-env.js \
--secretid=/myapp/prodconfig \
--region=$AWS_DEFAULT_REGION \
--accessKeyId=someAwsAccessKeyId \
--secretAccessKey=$SOME_AWS_ACCESS_KEY_ENV_VAR \
--useexport \
) && node myapp.js

npx "@phhu/aws-secrets-to-env" \
--ssmpath=/myapp/prodconfig \
--region=eu-central-1 \
--profile=someAwsProfile \
>.env && node myapp.js
```

## SAMPLE OUTPUT

As written to `.env` in the first example above:
```sh
VAL1fromParamStore="Value of /myapp/prodconfig/VAL1fromParamStore"
VAL2fromParamStore="encrypted value from parameter store"
VAL1_FromSecretManager="this is stored in /myapp/prodconfig"
VAL2_FromSecretManager="this is also stored in /myapp/prodconfig"
someNumber=1
someArray="[1,2,3]"
```

With `--useexport`, as in second example using `eval` above:
```sh
export VAL_FromSecretManager="this is stored in /myapp/prodconfig"
export someFloat=1.23
export someObj="{\"thing\":1,\"thing2\":2}"
```

## SCRIPT OPTIONS

  * --ssmpath : AWS Param Store Path to retrieve
  * --secretid : AWS Secrets Manager secret ID to retrieve. (This should return JSON key/value pairs)
  * --debug : write debugging info to stderr
  * --help : display this message
  * --useexport : include an "export" command at the start of each line
  * --profile : aws profile to use (from ~/.aws; e.g --profile=default). Alternatively you can set env variable AWS_PROFILE (e.g. `export AWS_PROFILE=test && node aws-secrets-to-env.js`)

## AWS OPTIONS

All other options will be passed through to the AWS request. Useful options include:

  * --region : AWS region. Needs to be specified. e.g. `--region=$AWS_DEFAULT_REGION`, `--region=us-east-1`
  *  --endpoint : specify an endpoint url (e.g. `--endpoint="http://localstack:4566"`)
  * --accessKeyId
  * --secretAccessKey

(see "options hash" under https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html and https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.html for more details).
