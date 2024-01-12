import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import FormControl from 'react-bootstrap/FormControl';

const UxfSearchInput = ({ ariaLabel, placeholder, className, innerRef, ...props }) => {
    const classes = classNames(
        'uxf-search-bar',
        className
    );

    return (
        <FormControl ref={innerRef} type="search" className={classes} aria-label={ariaLabel} placeholder={placeholder} {...props} />
    );
}

UxfSearchInput.propTypes = {
    /**
     * Aria-label of search input. This is required due to the
     * search component not having a label associated with it.
     */
    ariaLabel: PropTypes.string.isRequired,
    /**
     * Placeholder for search input.
     */
    placeholder: PropTypes.string
};

UxfSearchInput.defaultProps = {
    placeholder: 'Search'
};

export default UxfSearchInput;


