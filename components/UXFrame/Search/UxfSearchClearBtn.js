import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { MdClear as ClearIcon } from 'react-icons/md';

const UxfSearchClearBtn = ({ ariaLabel, className, ...props }) => {
    const classes = classNames(
        'uxf-search-bar-clear-icon',
        className
    );

    return (
        <Button variant='uxf-icon' type='reset' aria-label={ariaLabel} className={classes} {...props} >
            <ClearIcon className="uxf-icon-remove" />
        </Button>
    );
}

UxfSearchClearBtn.propTypes = {
    /**
     *  Aria-label of clear button. This notifies individuals using a screen
     *  reader that they are on the clear search component.
     */
    ariaLabel: PropTypes.string.isRequired
};


export default UxfSearchClearBtn;
