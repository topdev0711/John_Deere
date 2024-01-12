function createFileMap({ CommonPrefixes = [], Contents = [] }) {
  let fileMap = {};
  fileMap['Root'] = { name: 'Root', isDir: true, id: 'Root', childrenIds: []};
  fileMap = addDirectories(CommonPrefixes, fileMap);
  fileMap = addFilesAndChildren(Contents, fileMap);
  
  return fileMap;
}

function addDirectories(prefixes, fileMap) {
  return prefixes.reduce((map, { Prefix: prefix }) => {
    const directories =['Root', ...prefix.split('/').slice(0, -1)];

    return populateDirectory(directories, map);
  }, fileMap);
}

function addFilesAndChildren(contents, fileMap) {
  return contents.reduce((map, { Key: key, LastModified: modified, Size: size}) => {
    const filePath = ['Root', ...key.split('/')];
    const [ isFile ] = filePath.slice(-1);
    const fileId = !!isFile ? `/${key}` : '';
    const directories = !!isFile ? filePath : filePath.slice(0, -1);

    return populateDirectory(directories, map, fileId, modified, size);
  }, fileMap);
}

function populateDirectory(directories, map, fileId = '', modified = '', size = '') {
  let parentId = '', currentPath = '';
  directories.forEach((dir, index) => {
    if (dir !== 'Root') {
      currentPath = `${currentPath}/${dir}`;
      const childId = index + 1 < directories.length ? `${currentPath}/${directories[index + 1]}` : fileId;
      if (fileId === currentPath) {
        map[fileId] = createFile(fileId, dir, modified, size, parentId);
      } else {
        map[currentPath] = !map[currentPath] ? 
          createDirectory(dir, currentPath, childId, !parentId ? 'Root' : parentId) : 
          addChild(map[currentPath], childId);
      }
    } else {
      map['Root'] = addChild(map['Root'], `${currentPath}/${directories[index + 1]}`);
    }
    parentId = currentPath;
  });
  return map;
}

function createFile(id, name, modDate, size, currentPath) {
  const [ fileName ] = name.split('/').slice(-1);
  const hasExt = fileName.includes('.');
  return {
    id,
    name,
    ext: hasExt ? `.${name.split('.').slice(-1)}` : null,
    modDate, 
    size,
    parentId: !currentPath ? 'Root' : currentPath
  };
}

function createDirectory(name, id, child, parentId) {
  return {
    name, 
    isDir: true, 
    id, 
    childrenIds: !!child ?  [ child ] : [],
    parentId
  };
}

function addChild(object, childId) {
  if(!!childId && !object.childrenIds.some(id => id === childId)) {
    return {
      ...object, 
      childrenIds: [
        ...object.childrenIds,
        childId
      ]
    };
  }
  return object;
}

module.exports = {
  createFileMap
}