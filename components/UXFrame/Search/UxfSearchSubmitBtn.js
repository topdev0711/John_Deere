import React from 'react';
import PropTypes from 'prop-types';
import Button from 'react-bootstrap/Button';
import { MdSearch as SubmitIcon } from 'react-icons/md';

const UxfSearchSubmitBtn = ({ ariaLabel, onClick, className, ...props }) => {
    return (
        <Button variant='uxf-search' type='submit' aria-label={ariaLabel} className={className} onClick={onClick} {...props} >
            <SubmitIcon className="uxf-icon-search" />
        </Button>
    );
}

UxfSearchSubmitBtn.propTypes = {
    /**
     * Aria-label for search submit icon since icon has no text associated with it.
     */
    ariaLabel: PropTypes.string.isRequired,
    /**
     * Function associated with 'click' of submit icon
     */
    onClick: PropTypes.func
};

export default UxfSearchSubmitBtn;
