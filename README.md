This node.js script writes .env files or export commands to stdout based on values held in Amazon Web Services (AWS) Parameter Store and/or AWS Secrets Manager. Node applications can then be run using environment variables set by it, perhaps using package "dotenv" to retrieve from the .env file.

* Specify `--ssmpath` and/or `--secretid` to retrieve from AWS Parameter Store and/or AWS Secrets Manager respectively.
* You can specify `--accessKeyId=[awsAccessKeyId]` and `--secretAccessKey=[awsSecretAccessKey]`; otherwise default AWS auth is used.
* For the Parameter Store, parameters are returned by path (e.g. parameters with names starting with an arbitrary path such as "/myapp/prodconfig")

## SAMPLE USAGE: 

```sh
node aws-secrets-to-env.js \
--ssmpath=/myapp/prodconfig \
--secretid=/myapp/prodconfig \
--region=eu-central-1 \
>.env && node myapp.js

eval $(node aws-secrets-to-env.js \
--ssmpath=/myapp/prodconfig \
--secretid=/myapp/prodconfig \
--region=eu-central-1 \
--useexport \
) && node myapp.js

npx -y "@phhu/aws-secrets-to-env" \
--ssmpath=/myapp/prodconfig \
--region=eu-central-1 \
>.env && node myapp.js
```

## SAMPLE OUTPUT

As written to `.env` in examples above:
```sh
VAL1fromParamStore="Value of /myapp/prodconfig/VAL1fromParamStore"
VAL2fromParamStore="encrypted value from parameter store"
VAL1_FromSecretManager="this is stored in /myapp/prodconfig"
VAL2_FromSecretManager="this is also stored in /myapp/prodconfig"
someNumber=1
someArray="[1,2,3]"
```

With `--useexport`, as in example using `eval` above:
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
  * --profile : aws profile to use (from ~/.aws; e.g --profile=default). Alternatively you can set env variable AWS_PROFILE (e.g. `export AWS_PROFILE=TEST && node aws-secrets-to-env.js`)

## AWS OPTIONS

All other options will be passed through to the AWS request. Useful options include:

  * --region : AWS region. Defaults to "eu-central-1"
  * --endpoint : specify an endpoint url (e.g. `--endpoint="http://localstack:4566"`)
  * --accessKeyId
  * --secretAccessKey
