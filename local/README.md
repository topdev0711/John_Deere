### About
This is about how to run local development environment

### Dependencies needed to run this
docker <br>
aws cli <br>
awslocal <br>
python 3 <br>
tool for setting up aws credentials e.g. [gimme-aws-creds](https://developerexperience.deere.com/tools/a/aws/accessing_aws/aws_gimme_creds/) <br>

### Startup

get credentials to use aws cli commands locally
```console
foo@bar % gimme-aws-creds/bin/gimme-aws-creds
```
<br>

login to private docker registry (ECR)
```console
foo@bar % aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 305463345279.dkr.ecr.us-east-1.amazonaws.com
```

<br>

startup local env, note that if you change the dockerfile or any docker compose file you should use run.sh, otherwise you can use cached version which will run faster
```console
foo@bar % local/runCached.sh
```
