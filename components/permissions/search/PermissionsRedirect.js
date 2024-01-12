import {useRouter} from "next/router";
import React, {useEffect} from "react";

const PermissionsRedirect = () => {
  const router = useRouter();
  console.info(router.asPath)
  const newUrl = router.asPath.replace('/catalog', '');
  useEffect(() => {router.push(newUrl)}, []);
  return <></>;
};

export default PermissionsRedirect;
