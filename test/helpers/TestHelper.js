import {fireEvent, screen, act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const clickButton = async (desiredButtonName) => {
    const link = await screen.findAllByRole('button', {
        name: desiredButtonName
    });
    await act(async () => {fireEvent.click(link[0])})
};

export const clickByTestId = async (dataTestId) => {
    const testId = await screen.findAllByTestId(dataTestId)
    await act(async () => {userEvent.click(testId[0])});
};

export const changeInputByTestId = async (dataTestId, input) => {
    const testId = await screen.findAllByTestId(dataTestId)

    await act(async () => {fireEvent.change(testId[0], {target: {value: input}})})
    expect(testId[0].value).toBe(input)
};
