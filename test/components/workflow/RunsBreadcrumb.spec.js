import { shallow } from 'enzyme';
import RunsBreadcrumb from "../../../components/workflow/RunsBreadcrumb";

describe('TaskBreadcrumb tests',  () => {
  it('should have dataset details path', () => {
    const taskBreadcrumb = shallow(<RunsBreadcrumb datasetId={'anyId'}/>);
    const detailLink = taskBreadcrumb.find('#runs-detail-link');
    expect(detailLink.prop('href')).toEqual('/catalog/datasets/detail?id=anyId&edit=false');
  });

  it('should have dataset task path', () => {
    const taskBreadcrumb = shallow(<RunsBreadcrumb datasetId={'anyId'}/>);
    const detailLink = taskBreadcrumb.find('#runs-tasks-link');
    expect(detailLink.prop('href')).toEqual('/workflow/tasks?datasetId=anyId');
  });
});
