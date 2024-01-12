import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import ProgressIndicator from '../../../components/workflow/ProgressIndicator';

/*
* Verify Progress Indicator Component
 */

test('Verify Progress Indicator Component', () => {

  render(<ProgressIndicator />);

  expect(screen.getByTestId('searchingLoader')).toBeInTheDocument();
})