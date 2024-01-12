import React, { useRef, useEffect } from "react";
import {FormControl} from "react-bootstrap";
import {useRouter} from "next/router";
import {useGetPermissionsSwr} from "../../../apis/permissions";

const Searchbar = ({ searchTerm, setSearchTerm}) => {
  const {query} = useRouter();
  const {error, data: count} = useGetPermissionsSwr({...query, count: 'true', type: 'search'});

  if(error) console.error(error);
  const searchbarMessage = `Search ${count?.permissions ? `${count.permissions} `: ''}permissions`;
  const handleChange = e => setSearchTerm(e?.target?.value);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, [handleChange]);

  return (<FormControl ref={inputRef} id="permissions-searchbar" type="text" placeholder={searchbarMessage} defaultValue={searchTerm} onChange={handleChange}/>);
};

export default Searchbar;
