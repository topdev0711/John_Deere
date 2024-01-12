async function getSharepointToken(clientId, clientSecret, tenantId) {
    try{
        const body = {
            clientId: `${clientId}@${tenantId}`,
            clientSecret,
            tenantId
        };
        const response = await fetch('/api/managedtasks/sharepointToken', {
        credentials: 'same-origin',
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
        });
        const tokenData = await response.json();
        return `Bearer ${tokenData.access_token}`;
    }catch(error){
        console.log("error",error)
        throw error;
    }
}

async function getSharepointLists(sharepointToken, siteUrl) {
    try{
        const body = {
            sharepointToken,
            siteUrl
        };
        const response = await fetch('/api/Web/Lists', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
        });
        console.log("Response for sharepoint list is ",response);
        const jsonResponse = await response.json();
        const filteredResponse = jsonResponse.value.filter(item => item.Hidden === false);
        console.log("Filtered response is : ",filteredResponse);
        return filteredResponse;
    }catch(error){
        console.log("getSharepointLists error",error)
        throw error;
    }
}

async function getSharepointFolders(sharepointToken, siteUrl, docFolder) {
    try{
        const body = {
            sharepointToken,
            siteUrl,
            docFolder
        };
        const response = await fetch('/api/Web/getbyTitle', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
        });
        console.log("jsonResponse2",response)
        const jsonResponse = await response.json();
        return jsonResponse.value;
    }catch(error){
        console.log("getSharepointFolders error",error)
        throw error;
    }
}

async function getSharepointFilesFolder(sharepointToken, siteUrl, filePath) {
    try{
        const body = {
            sharepointToken,
            siteUrl,
            filePath
        };
        const response = await fetch('/api/Web/GetFolderByServerRelativeUrl', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
        });
        console.log("jsonResponse3",response)
        const jsonResponse = await response.json();
        return jsonResponse;
    }catch(error){
        console.log("getSharepointFilesFolder error",error)
        throw error;
    }
}

module.exports = { getSharepointToken, getSharepointLists, getSharepointFolders, getSharepointFilesFolder };