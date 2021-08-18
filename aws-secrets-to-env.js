#!/usr/bin/env node
const AWS = require('aws-sdk')
const minimist = require('minimist')

// config from args
const {
  help=false,
  debug=false,
  useexport=false,
  secretid=undefined,
  ssmpath=undefined,
  region='eu-central-1',
  _:otherArgs = undefined,
  ...otherOptions
} = minimist(process.argv.slice(2));

if (help || (!secretid && !ssmpath)){console.error(`
This node.js script writes .env files or export commands to stdout based on values held in AWS Parameter Store and/or AWS Secrets Manager. Node applications can then be run using environment variables set by it, perhaps using package "dotenv" to retrieve from the .env file.
Specify ssmpath and/or secretid to retrieve from AWS Parameter Store and/or AWS Secrets Manager respectively.
You can specify --accessKeyId=[awsAccessKeyId] and --secretAccessKey=[awsSecretAccessKey]; otherwise default AWS auth is used.

SAMPLE USAGE: 
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

SCRIPT OPTIONS
  --ssmpath: AWS Param Store Path to retrieve
  --secretid: AWS Secrets Manager secret ID to retrieve. (This should return JSON key/value pairs)
  --debug : write debugging info to stderr
  --help : display this message
  --useexport : include an "export" command at the start of each line  

AWS OPTIONS: All other options will be passed through to the AWS request. Useful options include:
  --region: AWS region. Defaults to "eu-central-1"
  --endpoint: specify an endpoint url (e.g. http://localstack:4566)
  --accessKeyId
  --secretAccessKey
`
);process.exit();}

// support funcs
const debugLog = (...args) => {if (debug) console.error("*",...args)}
const stripPath = x => x.replace(/^.*\/(.*?)$/,"$1")
const escape = x =>
  typeof x === "string" ? JSON.stringify(x) :
  typeof x === "number" ? x :
  JSON.stringify(JSON.stringify(x)) 
const exportVar = ([key,value]) => `${useexport ? "export ":""}${key}=${escape(value)}`

const awsConfig = {
  region,
  ...otherOptions
}

debugLog("secretid",secretid)
debugLog("ssmpath",ssmpath)
debugLog("AWS config object",awsConfig)

const awsResponseHandler = fn => (err,data) => {
  if (err) {
    console.error(err)
  } else {
    console.log(fn(data))
  }
}

// get from secrets manager
if (secretid){
  const secretsManagerClient = new AWS.SecretsManager(awsConfig)
  secretsManagerClient.getSecretValue({ 
      SecretId: secretid
    }, 
    awsResponseHandler(data => {
      debugLog("AWS Secrets Manager Response", data)
      try {
        return Object.entries(
          data?.SecretString && JSON.parse(data.SecretString) || {}
        )
        .map(exportVar)
        .join("\n")
      } catch(err) {
        console.error(
          "Error parsing AWS secrets manager response. Perhaps SecretString is not valid JSON", 
          "Data value:",
          data, 
          "Error:",
          err
        )
      }
    })
  )
}

// get from param store
if(ssmpath){
  const paramStoreClient = new AWS.SSM(awsConfig)
  paramStoreClient.getParametersByPath({ 
      Path: ssmpath,   //"/eb-hello-world/",
      WithDecryption: true
    }, 
    awsResponseHandler(data => {
      debugLog("AWS Param Store response", data)
      return (data?.Parameters || [])
      .map(p => exportVar([stripPath(p.Name),p.Value]))
      .join("\n")
    })
  )
}
