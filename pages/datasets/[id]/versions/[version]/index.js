import {useRouter} from "next/router";
import React, {useEffect} from "react";

const DatasetDetails = () => {
  const router = useRouter();
  const {id, version} = router.query;
  useEffect(() => {router.push(`/catalog/datasets/detail?id=${id}&version=${version}`)}, []);
  return <></>;
};

export default DatasetDetails;
