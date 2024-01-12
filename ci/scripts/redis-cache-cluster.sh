#!/bin/bash
set +x
component=enterprise-data-governance-center
region=us-east-1
environment=$1
redis_cluster_name=edl-redis-${environment}

create_redis_stack(){
  echo "In create stack "
  sed -i 's/REPLICATION_GROUP_ID/'${redis_cluster_name}'/g' "${PWD}/ci/config/redis/${environment}.json"
  aws cloudformation create-stack --stack-name ${redis_cluster_name} --enable-termination-protection \
                                  --region "${region}" \
                                  --template-body file://"${PWD}/ci/cloudFormationTemplates/jd-data-catalog-redis-cache-stack.yml" \
                                  --parameters file://"${PWD}/ci/config/redis/${environment}.json" \
                                  --tags Key="component",Value="${component}"
  echo "Stack creation in progress..."
  aws cloudformation wait stack-create-complete --stack-name ${redis_cluster_name} --region ${region}
}

update_redis_stack(){
  sed -i 's/REPLICATION_GROUP_ID/'${redis_cluster_name}'/g' "${PWD}/ci/config/redis/${environment}.json"
  aws cloudformation update-stack --stack-name ${redis_cluster_name}  \
                                  --region "${region}" \
                                  --template-body file://"${PWD}/ci/cloudFormationTemplates/jd-data-catalog-redis-cache-stack.yml" \
                                  --parameters file://"${PWD}/ci/config/redis/${environment}.json" 2>/dev/null
  STATUS=$(aws cloudformation describe-stacks --region=${region} --stack-name ${redis_cluster_name} --output=text --query 'Stacks[0].{Status:StackStatus}')
  echo -e "Stack in status ${STATUS}--------------------------------"
}

function delete_redis_stack() {
   if ! aws cloudformation describe-stacks --region ${region} --stack-name ${redis_cluster_name} 2>/dev/null;  then
     echo -e "Stack does not exist, cannot delete..."
  else
    if aws elasticache describe-replication-groups --replication-group-id ${redis_cluster_name} --region ${region} 2>/dev/null;  then
      aws elasticache delete-replication-group --replication-group-id ${redis_cluster_name} --region ${region}
      aws elasticache wait replication-group-deleted --replication-group-id ${redis_cluster_name} --region ${region}
    fi
    cloudformation_delete
  fi
}

cloudformation_delete(){
  echo "Deleting stack ${redis_cluster_name}..."
  aws cloudformation  update-termination-protection --no-enable-termination-protection --stack-name ${redis_cluster_name} --region ${region}
  aws cloudformation delete-stack --stack-name ${redis_cluster_name} --region ${region}
  aws cloudformation wait stack-delete-complete --stack-name ${redis_cluster_name} --region ${region}
  STATUS=$(aws cloudformation describe-stacks --region=${region} --stack-name ${redis_cluster_name} --output=text --query 'Stacks[0].{Status:StackStatus}')
  echo -e "Stack in ${STATUS}"
  if [ "${STATUS}" == 'DELETE_FAILED' ] || [ "${STATUS}" == 'ROLLBACK_FAILED' ];then
     echo "Deletion failed..."
  else
    echo "Stack deleted successfully.."
  fi
}

if ! aws cloudformation describe-stacks --region ${region} --stack-name ${redis_cluster_name} ; then
    echo -e "\nStack does not exist, creating..."
    create_redis_stack
else
    STATUS=$(aws cloudformation describe-stacks --region=${region} --stack-name ${redis_cluster_name} --output=text --query 'Stacks[0].{Status:StackStatus}')
    echo -e "\nStack in ${STATUS}"
    if [ $STATUS = 'DELETE_FAILED' ] || [  $STATUS = 'CREATE_FAILED' ]  || [ $STATUS == 'ROLLBACK_COMPLETE' ]; then
        delete_redis_stack
        create_redis_stack
    fi
    if [ $STATUS = 'CREATE_COMPLETE' ] || [ $STATUS == 'UPDATE_ROLLBACK_COMPLETE' ] || [ $STATUS == 'UPDATE_COMPLETE' ]; then
        update_redis_stack
    fi
fi
