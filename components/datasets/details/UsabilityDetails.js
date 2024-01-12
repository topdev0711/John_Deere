// Unpublished Work © 2022 Deere & Company.
import React, {useEffect, useState} from "react";
import {findUsabilityDetails} from "../../../apis/usability";
import {useFetch} from "../../../apis/apiHelper";
import SmallSpinner from "../../SmallSpinner";
import Usability from "../Usability";

const spanStyle = {position: 'absolute', top: 15, right: 20};

const UsabilityDetails = ({dataset}) => {
  const [usabilityDetails, setUsabilityDetails] = useState(undefined);
  const [usabilityDetailsError, setUsabilityDetailsError] = useState(undefined);

  const findUsability = async () => {
    const { data, error } = await useFetch(findUsabilityDetails(dataset));
    setUsabilityDetails(data);
    setUsabilityDetailsError(error);
  }

  useEffect(() => {findUsability()}, []);

  if(usabilityDetailsError) return <div>Usability Error: {usabilityDetailsError.error}</div>;
  if(!usabilityDetails) return <SmallSpinner />;
  return <Usability usabilityDetails={{...usabilityDetails}} buttonVariant="link" usabilitySpan={spanStyle}/>
}

export default UsabilityDetails;
