import { FormControl } from 'react-bootstrap';
import { useState, useEffect } from 'react'
import { FaSearch } from 'react-icons/fa';
import { CgCloseO } from 'react-icons/cg';

const EnhancedSearchBar = props => {
  const [searchCriteria, setSearchCriteria] = useState('')
  const [resultCount, setResultCount] = useState(props.items.length)

  useEffect(() => {
    let results = getSearchResults();
    setResultCount(results.length);
    props.onChange(results, searchCriteria);
  }, [searchCriteria])

  const filterItem = item => JSON.stringify(item)?.toLowerCase()?.includes(`${searchCriteria}`?.toLowerCase());
  const handleSearchChange = event => setSearchCriteria(event.target.value);
  const handleResetClick = () => setSearchCriteria('');
  const getSearchResults = () => props.items.filter(item => filterItem(item));

  return (
    <>
      <span className={'search-icon'}><FaSearch fontStyle={'light'} opacity={'0.8'}/></span>
      <FormControl id="EnhancedSearchBar" className={'searchBarEnhanced'} style={{borderRadius: '4px'}} placeholder="Search" {...props} type="text" value={searchCriteria} onChange={handleSearchChange} />
      <span class="close-icon" onClick={handleResetClick}><CgCloseO color="#33333" /></span>
    </>
  );
};

export default EnhancedSearchBar;
