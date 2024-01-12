import React from 'react';
import Flatpickr from 'react-flatpickr';
import Form from 'react-bootstrap/Form';

const DatePicker = ({
  labelText,
  inputAriaLabel,
  id,
  placeholder,
  options,
  hideLabel,
  disableMobile,
  dateFormat,
  flatPickrOptions,
  dateContext,
  ...props
}) => {
  return (
    <div 
    {...props} 
    className='uxf-date-picker'
    >
      {!hideLabel && (
        <Form.Label
          htmlFor={id}
          className='uxf-date-picker-label uxf-label'
        >
          {labelText}
        </Form.Label>
      )}
      <Flatpickr
        id={id}
        placeholder={placeholder}
        {...props}
        ref={dateContext}
        className={`form-control uxf-date-picker-input` + (props.isInvalid ? ' invalid-datepicker' : '')}
        style={{ borderColor: props.isInvalid ? '#c21020': ''}}
        aria-label={inputAriaLabel}
        data-date-format={dateFormat}
        data-disable-mobile={disableMobile}
        options={flatPickrOptions}
        data-next-arrow='<svg class="uxf-btn-icon" fill="#666666" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/><path fill="none" d="M0 0h24v24H0V0z"/></svg>'
        data-prev-arrow='<svg class="uxf-btn-icon" fill="#666666" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" /><path fill="none" d="M0 0h24v24H0V0z" /></svg>'
      />
    </div>
  )
}

DatePicker.defaultProps = {
  labelText: 'Select Date',
  placeholder: 'dd-mmm-yyyy',
  hideLabel: false,
  disableMobile: true,
  dateFormat: 'd-M-Y'
}

export default DatePicker;
