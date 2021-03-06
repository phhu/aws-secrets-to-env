#!/usr/bin/env node
const AWS = require('aws-sdk')
const minimist = require('minimist')

// config from args
const {
  help = false,
  debug = false,
  useexport = false,
  secretid = undefined,
  ssmpath = undefined,
  profile = undefined,
  _: otherArgs = undefined,
  ...otherOptions
} = minimist(process.argv.slice(2))

if (help) {
  const path = require('path')
  console.error(
    require('fs').readFileSync(path.resolve(__dirname,'README.md')).toString(),
    '\nVERSION:', require('./package.json').version
  )
  process.exit()
}
if (!secretid && !ssmpath) {
  console.error(
    'Please specify --secretid or --ssmpath.',
    '--region is required.',
    '\n--help for more details',
    '\nVERSION:', require('./package.json').version
  )
  process.exit()
}

// support funcs
const debugLog = (...args) => { if (debug) console.error('*', ...args) }
const stripPath = x => x.replace(/^.*\/(.*?)$/, '$1')
const escape = x =>
  typeof x === 'string'
    ? JSON.stringify(x)
    : typeof x === 'number'
      ? x
      : JSON.stringify(JSON.stringify(x))
const exportVar = ([key, value]) => `${useexport ? 'export ' : ''}${key}=${escape(value)}`
const omitSecrets = obj => { const { secretAccessKey, ...rest } = obj; return rest }

const awsConfig = {
  ...otherOptions
}
if (profile) {
  awsConfig.credentials = new AWS.SharedIniFileCredentials({ profile })
}

debugLog('secretid', secretid)
debugLog('ssmpath', ssmpath)
debugLog('AWS config object', omitSecrets(awsConfig))

const awsResponseHandler = fn => (err, data) => {
  if (err) {
    console.error(err)
  } else {
    console.log(fn(data))
  }
}

// get from secrets manager
// see https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_Operations.html
if (secretid) {
  (new AWS.SecretsManager(awsConfig)).getSecretValue(
    { SecretId: secretid },
    awsResponseHandler(data => {
      debugLog('AWS Secrets Manager Response', data)
      try {
        return Object.entries(
          (data && data.SecretString && JSON.parse(data.SecretString)) || {}
        )
          .map(exportVar)
          .join('\n')
      } catch (err) {
        console.error(
          'Error parsing AWS secrets manager response. Perhaps SecretString is not valid JSON',
          'Data value:',
          data,
          'Error:',
          err
        )
      }
    })
  )
}

// get from param store, recursively (limit MaxResults is 10 per batch)
// see https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParametersByPath.html
if (ssmpath) {
  const client = new AWS.SSM(awsConfig)
  const getParamsRecursive = (NextToken) => 
    client.getParametersByPath(
      {
        Path: ssmpath,
        WithDecryption: true,
        NextToken
      },
      awsResponseHandler(data => {
        debugLog('AWS Param Store response', data)
        const ret = (data && data.Parameters || [])
          .map(p => exportVar([stripPath(p.Name), p.Value]))
          .join('\n')
        if (data.NextToken){getParamsRecursive(data.NextToken)}
        return ret
      })
    )
  getParamsRecursive()
}
