import React from 'react';
import classNames from 'classnames';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import UxfSearchInput from '../Search/UxfSearchInput';
import UxfSearchClearBtn from '../Search/UxfSearchClearBtn';
import UxfSearchSubmitBtn from '../Search/UxfSearchSubmitBtn';
import { MdSearch as SearchIcon } from 'react-icons/md';
import { MdMenu as MenuIcon } from 'react-icons/md';
import { MdCancel as CancelIcon } from 'react-icons/md';

class UxfHeader extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      openSearch: false,
      openMenu: false,
      inputValue: ''
    };

    this.inputRef = React.createRef();

    this.handleClearBtnClick = this.handleClearBtnClick.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSearchBtnClick = this.handleSearchBtnClick.bind(this);
    this.setWrapperRef = this.setWrapperRef.bind(this);
    this.setNavWrapperRef = this.setNavWrapperRef.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleMenuClick = this.handleMenuClick.bind(this);
  }

  static defaultProps = {
    clearBtnProps: {},
    submitBtnProps: {},
    inputProps: {},
    navProps: {},
    navbarProps: {},
    formProps: {},
    pageHeading: 'Application Name',
    search: true,
    mobileMenu: true,
    logoAriaLabel: 'home page',
    closeIconAriaLabel: 'Close navigation menu',
    navbar: true,
    skipLinkText: 'Skip to main content'
  };

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    document.addEventListener('keyup', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
    document.removeEventListener('keyup', this.handleClickOutside);
  }

  handleClearBtnClick() {
    this.setState({ inputValue: '' });
    this.inputRef.current.focus();
  }

  handleInputChange(event) {
    this.setState({ inputValue: event.target.value });
  }

  handleSearchBtnClick(event) {
    const currentState = this.state.openSearch;
    !currentState && event.preventDefault();
    !currentState && this.inputRef.current.focus();
    this.setState({ openSearch: !currentState });

    if (this.inputRef.current.value == '') {
      event.preventDefault();
    }
  }

  handleMenuClick() {
    const currentState = this.state.openMenu;
    this.setState({ openMenu: !currentState });

    if (!currentState) {
      document.body.classList.add('uxf-backdrop');
      document.documentElement.classList.add('uxf-backdrop');
    } else {
      document.body.classList.remove('uxf-backdrop');
      document.documentElement.classList.remove('uxf-backdrop');
    }
  }

  /**
   * Set the wrapper ref
   */
  setWrapperRef(node) {
    this.wrapperRef = node;
  }

  setNavWrapperRef(node) {
    this.navWrapperRef = node;
  }

  /**
   * Alert if clicked on outside of element
   */
  handleClickOutside(event) {
    if ((this.wrapperRef && !this.wrapperRef.contains(event.target))
      && (!this.mobileSearchBtn.contains(event.target))) {
      this.setState({ openSearch: false });
    }

    if ((this.navWrapperRef && !this.navWrapperRef.contains(event.target))) {
      if (this.state.openMenu) {
        this.handleMenuClick();
      }
    }
  }

  render() {
    const {
      variant,
      className,
      pageHeading,
      pageHeadingLink,
      clearBtnProps,
      submitBtnProps,
      inputProps,
      navProps,
      navbarProps,
      formProps,
      headerTitleComponent,
      logoLink,
      logoAriaLabel,
      closeIconAriaLabel,
      children,
      search,
      mobileMenu,
      navbar,
      skipLink,
      skipLinkText,
      handleClick,
      ...props
    } = this.props;

    const classes = classNames(
      'uxf-header',
      'navbar',
      !headerTitleComponent && 'uxf-header-no-user',
      variant,
      className
    );

    const formClasses = classNames(
      'uxf-header-search',
      'navbar-form',
      this.state.openSearch && 'uxf-header-search-shown',
      formProps.className
    );

    const logoClasses = classNames(
      'uxf-logo',
      variant === 'uxf-header-jdf' && 'uxf-logo-jdf'
    );

    const inputClasses = classNames(
      (this.state.inputValue && this.state.openSearch) && 'active',
      inputProps.className
    );

    const navbarClasses = classNames(
      'uxf-top-nav',
      navbarProps.className
    );

    return (
      <div ref={this.setNavWrapperRef}>
        <div className="uxf-skip-link">
          <a className="sr-only sr-only-focusable" onClick={() => handleClick(skipLink)}>
            {skipLinkText}
          </a>
        </div>
        <header as="header" className={classes} >
          <a aria-label={logoAriaLabel} onClick={() => handleClick(logoLink)}>
            <div className={logoClasses} />
          </a>
          <div className="uxf-header-title">
            <h1 className="uxf-header-title-heading">
              <a className="uxf-header-title-link" style={{color: '#367c2b', cursor: 'pointer'}} onClick={() => handleClick(pageHeadingLink)}>{pageHeading}</a>
            </h1>
            {headerTitleComponent}
          </div>
          {search && <Button
            variant="uxf-mobile-search"
            className="uxf-btn-search"
            aria-controls="uxf-search-input"
            aria-expanded={this.state.openSearch}
            onClick={this.handleSearchBtnClick}
            ref={node => { this.mobileSearchBtn = node }}
          >
            <span className="sr-only">Toggle Search</span>
            <SearchIcon className="uxf-icon-search" />
          </Button>}

          {(mobileMenu && navbar) && <Navbar.Toggle
            aria-controls="uxf-header-navbar"
            aria-expanded={this.state.openMenu}
            onClick={this.handleMenuClick}
          >
            <MenuIcon className="menu-icon" />
          </Navbar.Toggle>}

          {search &&
            <Form role="search" className={formClasses} ref={this.setWrapperRef} {...formProps}>
              <UxfSearchInput
                id="uxf-search-input"
                tabIndex={this.state.openSearch ? 0 : -1}
                onChange={this.handleInputChange}
                value={this.state.inputValue}
                ariaLabel={inputProps.ariaLabel}
                innerRef={this.inputRef}
                className={inputClasses}
                placeholder={inputProps.placeholder}
                ariaLabel={'Search'}
                {...inputProps}
              />
              <UxfSearchClearBtn
                onClick={this.handleClearBtnClick}
                ariaLabel={clearBtnProps.ariaLabel}
                className={clearBtnProps.className}
                {...clearBtnProps}
              />
              <UxfSearchSubmitBtn
                ariaLabel={submitBtnProps.ariaLabel}
                className={submitBtnProps.className}
                onClick={this.handleSearchBtnClick}
                aria-controls="uxf-search-input"
                aria-expanded={this.state.openSearch}
                {...submitBtnProps}
              />
              <Button type="submit" variant="uxf-mobile-search">Go</Button>
            </Form>}
        </header>
        {navbar && <Navbar variant="uxf" expand="md" className={navbarClasses} {...navbarProps}>
          <Navbar.Collapse in={this.state.openMenu} id="uxf-header-navbar">
            <Nav {...navProps}>
              <Nav.Item className="uxf-nav-back">
                <Button
                  variant="link"
                  className="navbar-back"
                  onClick={this.handleMenuClick}
                  aria-label={closeIconAriaLabel}
                  aria-controls="uxf-header-navbar"
                  aria-expanded={this.state.openMenu}>
                  <CancelIcon />
                </Button>
              </Nav.Item>
              {children}
            </Nav>
          </Navbar.Collapse>
          <h1 className="uxf-nav-title">
            <a href={pageHeadingLink}>{pageHeading}</a>
          </h1>
        </Navbar>}
      </div>
    );
  }
}

export default UxfHeader;
