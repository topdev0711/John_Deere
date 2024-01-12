import ReactSelect, {components} from 'react-select';
import CreatableSelect from 'react-select/creatable';
import Button from 'react-bootstrap/Button';
import {MdAdd} from 'react-icons/md';

const Menu = (props) => {
  return (
      <components.Menu 
      {...props}
      >
        <div>
          <div>{props.children}</div>
            {!!props.selectProps.isApplication ? (
              <Button onClick={props.selectProps.showModal} variant="outline-secondary" size="sm" block style={{
                height: 40,
                color: 'black'
              }}>
                <MdAdd /> {props.selectProps.text}
              </Button>
            ) : null
          }
        </div>
      </components.Menu>
  );
};

const styles = (isInvalid) => ({
  option: (base, { isFocused, isDisabled, isSelected }) => {
    let backgroundColor = 'white'
    if (isFocused && !isDisabled) {
      backgroundColor = 'rgba(50,127,36,.25)'
    } else if (isSelected && !isDisabled) {
      backgroundColor = '#367C2B'
    }
    return {
      ...base,
      backgroundColor,
    }
  },
  placeholder: (base) => ({
    ...base,
    fontFamily: 'initial',
  }),
  control: (base, { isFocused }) => ({
    ...base,
    boxShadow: isFocused ? (!isInvalid ? '0 0 0 .1875rem rgba(50,127,36,.25)' : '0 0 0 .1875rem rgba(194,16,32,.25)') : 0,
    borderRadius: '2px',
    borderColor: !isInvalid ? '#666' : '#c21020',
    '&:hover': {
      borderColor: !isInvalid ? '#666' : '#c21020',
    }
  })
});

const Select = ({roleContext, ...props}) => {
  const {isSorted = false, options} = props;
  if(!isSorted) {
      options.sort((a, b) => {
      const aValue = !!a.label ? a.label.toLowerCase() : a.name.toLowerCase();
      const bValue = !!b.label ? b.label.toLowerCase() : b.name.toLowerCase();

      if (aValue === 'all') {
        return -1;
      }
      if (bValue === 'all') {
        return 1;
      }

      if (aValue < bValue) {
        return -1;
      }
      if (aValue > bValue) {
        return 1;
      }
      return 0;
    });
  }

  const formatGroupLabel = data => (
    <div className='group-label'>
      <span>{data.groupLabel}</span>
    </div>
  );

  if (!props.createable) {
    return (
      <ReactSelect
        instanceId={props.id}
        getOptionLabel={(option) => !!option.label ? option.label : option.name}
        getOptionValue={(option) => option.id}
        styles={styles(props.isInvalid)}
        {...props}
        options={options}
        formatGroupLabel={formatGroupLabel}
        components={{Menu}}
        ref={roleContext}
      />
    );
  }
  return (
    <CreatableSelect
      tabIndex="0"
      styles={styles(props.isInvalid)}
      {...props}
      options={options}
    />
  );
};

export default Select;
