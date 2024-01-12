import uuidv4 from "uuid/v4";

class SourceUtils {
  constructor(sources = [], setSources) {
    this.sources = sources;
    this.setSources = setSources;
  }

  #hasIds = source => Object.values(source).every(value => value?.id);

  hasAllIds = () => this.sources.every(this.#hasIds);

  #setSourceWithIds = source => {
    const idEntries = Object.entries(source).map( ([key, value]) => {
      const newValue = value?.id ? value : {id: uuidv4(), value};
      return {[key]:newValue};
    });
    const merge = (newSource, entry) => ({...newSource, ...entry});
    const sourcesWithFieldIds = idEntries.reduce(merge, {});
    const uiId = source.uiId || { id: uuidv4() };

    return { ...sourcesWithFieldIds, uiId };
  }

  setSourcesWithIds = () => {
    if (this.hasAllIds()) return;
    this.setSources(this.sources.map(this.#setSourceWithIds))
  }

  #removeIds = ({uiId, ...remainingFields}) => {
    const idEntries = Object.entries(remainingFields).map( ([key, value]) => ({[key]:value.value}))
    const merge = (newSource, entry) => ({...newSource, ...entry});
    return idEntries.reduce(merge, {});
  }

  sourcesWithNoIds = () => this.sources.map(this.#removeIds);

  addSource = () => {
    const uiId = uuidv4();
    const newSource = {uiId: {id: uiId}, type: 'dataset', namespace: `any.namespace.${this.sources.length}`, comments: '', server: '', database: '', table: ''};
    const newSources = [...this.sources, newSource];
    this.setSources(newSources);
    return uiId;
  }

  removeSource = someSource => this.setSources(this.sources.filter(source => source.namespace.value !== someSource.namespace.value));

}

export default SourceUtils;
