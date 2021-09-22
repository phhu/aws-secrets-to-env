for i in {10..500}
do
  # https://docs.aws.amazon.com/cli/latest/reference/ssm/put-parameter.html
  aws ssm put-parameter --name /test/param$i --value test --type String
done

aws ssm get-parameters-by-path --path /test/