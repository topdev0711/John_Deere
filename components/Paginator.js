import { createUltimatePagination, ITEM_TYPES } from 'react-ultimate-pagination';
import { Pagination } from 'react-bootstrap';

const itemTypeToComponent = {
  [ITEM_TYPES.PAGE]: ({ value, isActive, onClick }) => <Pagination.Item active={isActive} onClick={onClick}>{value}</Pagination.Item>,
  [ITEM_TYPES.ELLIPSIS]: Pagination.Ellipsis,
  [ITEM_TYPES.FIRST_PAGE_LINK]: Pagination.First,
  [ITEM_TYPES.PREVIOUS_PAGE_LINK]: Pagination.Prev,
  [ITEM_TYPES.NEXT_PAGE_LINK]: Pagination.Next,
  [ITEM_TYPES.LAST_PAGE_LINK]: Pagination.Last
}

const Paginator = createUltimatePagination({ itemTypeToComponent, WrapperComponent: ({ children }) => <Pagination>{children}</Pagination> })

export default Paginator
