import Footer from '../../components/Footer';
import {shallow, mount } from 'enzyme';

describe('Footer component test suite', () => {
  it('verify component renders', () => {
    const footer = mount(<Footer />);
    expect(footer).toBeDefined();
  })

  it('verify component renders with links', () => {
    const footer = shallow(<Footer />);

    const uxfFooter = footer.find('UxfFooter');
    expect(uxfFooter).toHaveLength(1);

    const linkComps = footer.find('FooterLink');
    expect(linkComps).toHaveLength(7);
  });
});
