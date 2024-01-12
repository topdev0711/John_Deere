import {useRouter} from "next/router";
import React, {useEffect} from "react";

const DatasetDetails = () => {
  const router = useRouter();
  useEffect(() => {router.push(`/catalog/datasets/detail?id=${router.query.id}`)}, []);
  return <></>;
};

export default DatasetDetails;
