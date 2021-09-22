const obj = {}
for (let i=10;i<600;i++){
  obj["val"+i] = "test ".repeat(10)
}
console.log(JSON.stringify(obj))

// https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_Operations.html
// aws secretsmanager get-secret-value --secret-id /test/