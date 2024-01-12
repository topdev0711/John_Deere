import PropTypes from 'prop-types';
import classNames from 'classnames';
import React from 'react';

const UxfFooter = ({ className, children, copyright, copyrightPrepend, copyrightAppend, currentYear, ...props }) => {
  const classes = classNames(
    'footer',
    'uxf-footer',
    className
  );

  const copyrightMessage = `${copyrightPrepend} ${currentYear} ${copyrightAppend}`;

  return (

    <footer
      className={classes}
      {...props}
    >
      <div className="container-fluid">
        <div className="row">
          <div className="col-24">
            {children}
            {copyright &&
              <span className="uxf-footer-legal">
                {copyrightMessage}
              </span>
            }
          </div>
        </div>
      </div>
    </footer>
  );
}

UxfFooter.propTypes = {
  /**
   * Display copyright with footer
   */
  copyright: PropTypes.bool,
  /**
   * Content that comes before year in copyright
   */
  copyrightPrepend: PropTypes.string,
  /**
   * Content that comes after year in copyright
   */
  copyrightAppend: PropTypes.string,
  /**
   * Year associated with copyright (usually current year)
   */
  currentYear: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ])
};

UxfFooter.defaultProps = {
  copyright: true,
  copyrightPrepend: 'Copyright ©',
  copyrightAppend: 'Deere & Company. All Rights Reserved.',
  currentYear: new Date().getFullYear()
};

export default UxfFooter;


