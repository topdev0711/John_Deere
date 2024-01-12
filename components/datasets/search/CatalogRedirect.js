import {useRouter} from "next/router";
import React, {useEffect} from "react";

const DatasetDetails = () => {
  const router = useRouter();
  useEffect(() => {router.push('/datasets?from=0&size=20')}, []);
  return <></>;
};

export default DatasetDetails;
