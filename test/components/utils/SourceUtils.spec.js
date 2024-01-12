import SourceUtils from "../../../components/utils/SourceUtils";

describe('SourceUtils tests', () => {
  it('adds ID to a source', () => {
    let sources = [{ namespace: 'anyNameSpace'}];
    const setSources = newSources => sources = newSources;
    const sourceUtils = new SourceUtils(sources, setSources);
    sourceUtils.setSourcesWithIds(sources);
    expect(sources[0].hasOwnProperty('uiId')).toEqual(true);
  });

  it('adds ID to source field', () => {
    let sources = [{ namespace: 'anyNameSpace'}];
    const setSources = newSources => sources = newSources;
    const sourceUtils = new SourceUtils(sources, setSources);
    sourceUtils.setSourcesWithIds();
    expect(sources[0].namespace.hasOwnProperty('id')).toEqual(true);
    expect(sources[0].namespace.value).toEqual('anyNameSpace');
  });

  it('does not add ID', () => {
    let sources = [{namespace: {id: '09876', value: 'anyNameSpace'}, uiId: {id: '45678'}}];
    const setSources = newSources => sources=newSources;
    const sourceUtils = new SourceUtils(sources, setSources);
    sourceUtils.setSourcesWithIds();
    expect(sources[0].namespace.id).toEqual('09876');
    expect(sources[0].uiId.id).toEqual('45678');
  });

  it('removes IDs on all sources', () => {
    let sources = [{ namespace: {id: '12345', value: 'anyNameSpace'}}];
    const setSources = newSources => sources = newSources;
    const sourceUtils = new SourceUtils(sources, setSources);
    const nodIdSources = sourceUtils.sourcesWithNoIds();
    expect(nodIdSources[0].namespace).toEqual('anyNameSpace');
  });

  it('adds a source', () => {
    let sources = [];
    const setSources = newSources => sources = newSources;
    const sourceUtils = new SourceUtils([], setSources);

    expect(sources.length).toEqual(0);
    sourceUtils.addSource();
    expect(sources.length).toEqual(1);
  });

  it('removes a source', () => {
    let sources = [{uiId: { id: 'abc'}, type: 'dataset'}, {uiId: { id: 'efg'}, type: 'dataset'}];
    const setSources = newSources => sources = newSources;
    const sourceUtils = new SourceUtils([], setSources);

    expect(sources.length).toEqual(2);
    sourceUtils.removeSource({uiId: { id: 'abc'}, type: 'dataset'});
    expect(sources.length).toEqual(0);
  });
});
