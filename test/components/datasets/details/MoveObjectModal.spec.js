import { shallow } from 'enzyme';
import React from 'react';
import { Button  } from 'react-bootstrap';
import ValidatedInput from '../../../../components/ValidatedInput';
import { waitFor, act} from '@testing-library/react';
import MoveObjectModal from '../../../../components/datasets/details/MoveObjectModal'

global.fetch = require('jest-fetch-mock');
const datasetBucket = "my-bucket";
const s3Object = "oldkey";
const datasetAccount = "account";
const updatedKey = "newkey";

describe("MoveObjectModal test suite", () => {
    it("should render without show", () => {
        const wrapper = shallow(<MoveObjectModal />);
        expect(wrapper).toBeDefined();
      });

    it("should move file when called", async () => {
        const callback = jest.fn;
        const expectedParams = {
            credentials: "same-origin",
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bucket: datasetBucket,
                oldFilePath: s3Object,
                newFilePath: updatedKey,
                account: datasetAccount
                })
        };
        const actionStatusForMove = {type: 'noType', status: '', error: false, message: ''};

        const wrapper = shallow(<MoveObjectModal show={true} handleClose = {callback} s3Object="oldkey" moveCompleted = {() => ""} datasetBucket="my-bucket" datasetAccount="account"  actionStatusForMove={()=>actionStatusForMove} />)
        act( () => {
            wrapper.find(ValidatedInput).prop('onChange')({ target: { value: 'newkey' }})
        })
        const okButton = wrapper.find(Button).filterWhere(button => button.props().variant === 'primary');
        okButton.simulate('click');
        wrapper.update();
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        expect(fetch).toHaveBeenCalledWith(`/api/datasets/move-file`, expectedParams);

    });
    it("should disable the ok button if destination key is invalid", async () => {
        const callback = jest.fn;
        const actionStatusForMove = {type: 'noType', status: '', error: false, message: ''};

        const wrapper = shallow(<MoveObjectModal show={true} handleClose = {callback} s3Object="oldkey" moveCompleted = {() => ""} datasetBucket="my-bucket" datasetAccount="account"  actionStatusForMove={()=>actionStatusForMove} />)
        act( () => {
            wrapper.find(ValidatedInput).prop('onChange')({ target: { value: 'new\\key' }})
        })
        const okButton = wrapper.find(Button).filterWhere(button => button.props().variant === 'primary');
        expect(okButton.prop('disabled')).toEqual(true);
    });

    it("should disable the ok button if destination key contains invalid chracters", async () => {
        const callback = jest.fn;
        const actionStatusForMove = {type: 'noType', status: '', error: false, message: ''};

        const wrapper = shallow(<MoveObjectModal show={true} handleClose = {callback} s3Object="oldkey" moveCompleted = {() => ""} datasetBucket="my-bucket" datasetAccount="account"  actionStatusForMove={()=>actionStatusForMove} />)
        act( () => {
            wrapper.find(ValidatedInput).prop('onChange')({ target: { value: 'new%key' }})
        })
        const okButton = wrapper.find(Button).filterWhere(button => button.props().variant === 'primary');
        expect(okButton.prop('disabled')).toEqual(true);
    });


})
