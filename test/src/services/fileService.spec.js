import fileService from '../../../src/services/fileService';

const sampleResponse = {
  CommonPrefixes: [
    {
      "Prefix": "folder/"
    },
    {
      "Prefix": "path/"
    }
  ],
  Contents: [
    {
      Key: 'another_file.ext',
      Size: 123979473,
      LastModified: '1/1/2001'
    },       
    {
      Key: 'some_other_key.ext',
      Size: 123979473,
      LastModified: '1/1/2002'
    }
  ]
};

const sampleResponsePrefix = {
  CommonPrefixes: [
    {
      Prefix: 'path/to/'
    },
    {
      Prefix: 'path/to-somewhere-else/'
    }
  ],
  Contents: [
    {
      "Key": "path/",
      "LastModified": "2020-05-18T23:51:33.000Z",
      "Size": 0,
      "StorageClass": "STANDARD"
    },
    {
      Key: 'path/file.ext',
      Size: 123979473,
      LastModified: '1/1/2001'
    }, 
  ]
};

const expectedFileMap = { 
  'Root': { 
    name: 'Root', 
    isDir: true, 
    id: 'Root', 
    childrenIds: ['/folder', '/path', '/another_file.ext', '/some_other_key.ext']
  },
  '/folder': { 
     name: 'folder',
     isDir: true,
     id: '/folder',
     childrenIds: [],
     parentId: 'Root'
   },
  '/path': { 
      name: 'path',
      isDir: true,
      id: '/path',
      childrenIds: [],
      parentId: 'Root'
  },
  '/some_other_key.ext': { 
    id: '/some_other_key.ext',
    name: 'some_other_key.ext',
    ext: '.ext',
    modDate: '1/1/2002',
    size: 123979473,
    parentId: 'Root' 
  },
  '/another_file.ext': {
    id: '/another_file.ext',
    name: 'another_file.ext',
    ext: '.ext',
    modDate: '1/1/2001',
    size: 123979473,
    parentId: 'Root' 
  }
};

const expectedFileMapPrefix = {
  'Root': {
    name: 'Root',
    isDir: true,
    id: 'Root',
    childrenIds: ['/path']
  },
  '/path/to': {
    name: 'to',
    isDir: true,
    id: '/path/to',
    childrenIds: [],
    parentId: '/path'
  },
  '/path': { 
    name: 'path',
    isDir: true,
    id: '/path',
    childrenIds: ['/path/to', '/path/to-somewhere-else', '/path/file.ext'],
    parentId: 'Root'
  },
  '/path/file.ext': {
    id: '/path/file.ext',
    name: 'file.ext',
    ext: '.ext',
    modDate: '1/1/2001',
    size: 123979473,
    parentId: '/path'
  },
  '/path/to-somewhere-else': { 
    name: 'to-somewhere-else',
    isDir: true,
    id: '/path/to-somewhere-else',
    childrenIds: [],
    parentId: '/path'
  },
};

describe('fileService Test Suite', () => {
  it('should return simple fileMap if empty object is passed in', () => {
    const expectedMap =  {
      "Root": {
        "childrenIds": [],
        "id": "Root",
        "isDir": true,
        "name": "Root",
      }
    };
    expect(fileService.createFileMap({})).toEqual(expectedMap);
  });

  it('should return fileMap built from s3 response', () => {
    const result = fileService.createFileMap(sampleResponse);

    expect(result).toEqual(expectedFileMap);
  });

  it('should be able to pass a prefix for a type and build files in map for each returned prefix',  () => {
    const result = fileService.createFileMap(sampleResponsePrefix);

    expect(result).toEqual(expectedFileMapPrefix);
  });

  it('should should return null ext when none is present', () => {
    const expectedMap = {
      "/another_file": {
        "ext": null, 
        "id": "/another_file", 
        "modDate": "1/1/2001", 
        "name": "another_file", 
        "parentId": "Root", 
        "size": 123979473
      }, 
      "Root": {
        "childrenIds": ["/another_file"], 
        "id": "Root", 
        "isDir": true, 
        "name": "Root"
      }
    }
    const response = {
      CommonPrefixes: [
      ],
      Contents: [
        {
          Key: 'another_file',
          Size: 123979473,
          LastModified: '1/1/2001'
        }      
      ]
    };

    const result = fileService.createFileMap(response);
    
    expect(result).toEqual(expectedMap);
  });

  it('should separate contents multiple layers deep into separate files in map', async () => {
    const response = {   
      Contents: [
        {
          "Key": "path/to/",
          "LastModified": "2020-05-18T23:51:33.000Z",
          "Size": 0,
          "StorageClass": "STANDARD"
        }
      ]
    };
    const expectedReturnObject = {
      'Root': {
        name: 'Root',
        isDir: true,
        id: 'Root',
        childrenIds: ['/path']
      },
      '/path/to': {
        name: 'to',
        isDir: true,
        id: '/path/to',
        childrenIds: [],
        parentId: '/path'
      },
      '/path': { 
        name: 'path',
        isDir: true,
        id: '/path',
        childrenIds: ['/path/to'],
        parentId: 'Root'
      }
    };
    const result = fileService.createFileMap(response);

    expect(result).toEqual(expectedReturnObject);
  });
});