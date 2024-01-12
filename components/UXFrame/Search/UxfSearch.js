import React from 'react';
import PropTypes from 'prop-types';
import UxfSearchSubmitBtn from './UxfSearchSubmitBtn';
import UxfSearchClearBtn from './UxfSearchClearBtn';
import UxfSearchInput from './UxfSearchInput';
import InputGroup from 'react-bootstrap/InputGroup';
import classNames from 'classnames';

class UxfSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputValue: ''
        };

        this.inputRef = React.createRef();

        this.handleClick = this.handleClick.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    static propTypes = {
        /**
         * Additional props passed to the clear button
         */
        clearBtnProps: PropTypes.object,
        /**
         * Additional props passed to the search submit button
         */
        submitBtnProps: PropTypes.object,
        /**
         * Additional props passed to the search input
         */
        inputProps: PropTypes.object
    };

    static defaultProps = {
        clearBtnProps: {},
        submitBtnProps: {},
        inputProps: {}
    };


    handleClick() {
        this.setState({ inputValue: '' });
        this.inputRef.current.focus();
    }

    handleChange(event) {
        this.setState({ inputValue: event.target.value });
    }

    render() {
        const {
            clearBtnProps,
            submitBtnProps,
            inputProps
        } = this.props;

        const submitBtnClasses = classNames(
            'uxf-search-bar-submit-icon',
            submitBtnProps.className
        );

        return (
            <>
                <UxfSearchInput
                    onChange={this.handleChange}
                    value={this.state.inputValue}
                    ariaLabel={inputProps.ariaLabel}
                    innerRef={this.inputRef}
                    className={this.state.inputValue && 'active'}
                    {...inputProps}
                />
                <InputGroup.Append>
                    <UxfSearchClearBtn
                        onClick={this.handleClick}
                        ariaLabel={clearBtnProps.ariaLabel}
                        {...clearBtnProps}
                    />
                    <UxfSearchSubmitBtn ariaLabel={submitBtnProps.ariaLabel} className={submitBtnClasses} {...submitBtnProps} />
                </InputGroup.Append>
            </>
        );
    }
}

export default UxfSearch;


