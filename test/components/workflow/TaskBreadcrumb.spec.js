import { shallow } from 'enzyme';
import TaskBreadcrumb from '../../../components/workflow/TaskBreadcrumb';

describe('TaskBreadcrumb tests',  () => {
  it('should have dataset details path', () => {
    const taskBreadcrumb = shallow(<TaskBreadcrumb datasetId={'anyId'}/>);
    const detailLink = taskBreadcrumb.find('#task-detail-link');
    expect(detailLink.prop('href')).toEqual('/catalog/datasets/detail?id=anyId&edit=false');
  });
});