// Unpublished Work © 2022 Deere & Company.
import { shallow } from 'enzyme';
import React from 'react';
import SourcesEdit from '../../../../components/datasets/edit/SourcesEdit';
import Accordion from '../../../../components/Accordion';
import {Button} from "react-bootstrap";

describe('SourcesEdit tests', () => {
  it('should render sources when they exist', () => {
    let sources = [{ randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}}];
    const setSources = newSources => sources = newSources;
    const sourcesEdit = shallow(<SourcesEdit sources={sources} setSources={setSources} setModal= {() => {}} />);
    const sourceForms = sourcesEdit.find(Accordion);
    expect(sourceForms.length).toEqual(1);
  });

  it('should not render sources when there are none', () => {
    let sources = [];
    const setSources = newSources => sources = newSources;
    const sourcesEdit = shallow(<SourcesEdit sources={sources} setSources={setSources} setModal= {() => {}} />);
    const sourceForms = sourcesEdit.find(Accordion);
    expect(sourceForms.length).toEqual(0);
  });

  it('should add a source', () => {
    let sources = [];
    const setSources = newSources => sources = newSources;
    const sourcesEdit = shallow(<SourcesEdit sources={sources} setSources={setSources} setModal= {() => {}} />);
    const addSourcesButton = sourcesEdit.find(Button);
    addSourcesButton.simulate('click');
    sourcesEdit.update();
    expect(sources.length).toEqual(1);
  });

  it('should update sources to have IDs', () => {
    let sources = [{ randomKey: 'anyRandomValue'}];
    const setSources = newSources => sources = newSources;
    const sourcesEdit = shallow(<SourcesEdit sources={sources} setSources={setSources} setModal= {() => {}} />);
    const loadingDiv = sourcesEdit.find('#sources-edit-loading');
    expect(loadingDiv.length).toEqual(1);
  });
});
