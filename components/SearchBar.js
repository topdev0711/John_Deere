import { FormControl } from 'react-bootstrap';
import Spacer from './Spacer'
import { useState, useEffect } from 'react'

const SearchBar = props => {
  const [searchCriteria, setSearchCriteria] = useState('')
  const [resultCount, setResultCount] = useState(props.items.length)

  useEffect(() => {
    let results = getSearchResults()
    setResultCount(results.length)    
    props.onChange(results, searchCriteria)
  }, [searchCriteria])

  const filterItem = item => {
    return JSON.stringify(item).toLowerCase().includes(`${searchCriteria}`.toLowerCase());
  }

  const handleSearchChange = event => {
    setSearchCriteria(event.target.value);
  }

  const getSearchResults = () => {
    return props.items.filter(item => filterItem(item));
  }

   const parentDivStyle = (props.parDivProps) ? props.parDivProps : {};

  return (
    <div style={parentDivStyle }>
      <FormControl placeholder="Search" {...props} type="text" value={searchCriteria} onChange={handleSearchChange} />
      <div style={{ marginTop: '5px'}} hidden={!!resultCount} className="text-muted small">No Results</div>
      <Spacer height='15px' />
    </div>
  )
};

export default SearchBar;

