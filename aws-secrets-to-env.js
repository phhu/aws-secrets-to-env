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
  region = 'eu-central-1',
  _: otherArgs = undefined,
  ...otherOptions
} = minimist(process.argv.slice(2))

if (help || (!secretid && !ssmpath)) {
  console.error(
    require('fs').readFileSync('./README.md').toString(),
    '\nVERSION:', require('./package.json').version
  )
  process.exit()
}

// support funcs
const debugLog = (...args) => { if (debug) console.error('*', ...args) }
const stripPath = x => x.replace(/^.*\/(.*?)$/, '$1')
const escape = x =>
  typeof x === 'string' ? JSON.stringify(x)
    : typeof x === 'number' ? x
      : JSON.stringify(JSON.stringify(x))
const exportVar = ([key, value]) => `${useexport ? 'export ' : ''}${key}=${escape(value)}`

const awsConfig = {
  region,
  ...otherOptions
}

debugLog('secretid', secretid)
debugLog('ssmpath', ssmpath)
debugLog('AWS config object', awsConfig)

const awsResponseHandler = fn => (err, data) => {
  if (err) {
    console.error(err)
  } else {
    console.log(fn(data))
  }
}

// get from secrets manager
if (secretid) {
  const secretsManagerClient = new AWS.SecretsManager(awsConfig)
  secretsManagerClient.getSecretValue(
    {SecretId: secretid},
    awsResponseHandler(data => {
      debugLog('AWS Secrets Manager Response', data)
      try {
        return Object.entries(
          data?.SecretString && JSON.parse(data.SecretString) || {}
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

// get from param store
if (ssmpath) {
  const paramStoreClient = new AWS.SSM(awsConfig)
  paramStoreClient.getParametersByPath({
    Path: ssmpath,
    WithDecryption: true
  },
  awsResponseHandler(data => {
    debugLog('AWS Param Store response', data)
    return (data?.Parameters || [])
      .map(p => exportVar([stripPath(p.Name), p.Value]))
      .join('\n')
  })
  )
}
