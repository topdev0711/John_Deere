// Unpublished Work © 2022 Deere & Company.
import { mount } from 'enzyme';
import CatalogBadge from '../../../../components/search/CatalogBadge';
import {Badge} from "react-bootstrap";

describe('CatalogBadge test', () => {
    it('should render popover element when hover', async () => {
        const label = 'test label';
        const onClick = () => {}
        const isHidden = false

        const wrapper = mount(<CatalogBadge label={label} onClick={onClick} isHidden={isHidden} />);
        const badge = wrapper.find(Badge);
        expect(badge.exists).toBeTruthy();
        expect(badge.text().trim()).toEqual(label)
    });
});
