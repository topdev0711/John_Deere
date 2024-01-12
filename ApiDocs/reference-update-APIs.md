# Reference APIs

## About
These APIs are used to update all existing datasets classifications and permission entitlements when community and subCommunity information has changed

#### PATCH `/api-external/references/community/:id/update`
##### About
This endpoint will update the community name for all dataset classifications and permission entitlements that use the community id provided in the URI<br />

Auth required: YES<br>
Permissions required: None<br>

<b>URI Parameters</b><br />
`id = the community id`<br /><br />
<b>Query Parameters</b><br />
None<br /><br />
<b>Data Parameters</b><br />
None<br />

<b>Success response:</b><br />
Code `200`<br />
Content
```json
{
    "message": "Successfully updated community"
}
```

<b>Error response:</b><br />
Code `404`<br />
Content 
```json
{ "error": "community does not exist: <id>" }
```

<br /><br /><br /><br />

#### PATCH `/api-external/references/subCommunity/:id/update`
##### About 
This endpoint will update the subCommunity name, community id, and community name for all dataset classifications and permission entitlements that use the subCommunity id provided in the URI<br />

when data(body) parameter is provided it will change/move from the subCommunity provided in the URI to the newID provided in the body in addition to the changes noted above. 

Auth required: YES<br>
Permissions required: None<br>

<b>URI Parameters</b><br />
`id = the existing subCommunity id`<br /><br />
<b>Query Parameters</b><br />
None<br /><br />
<b>Data Parameters (optional)</b><br />
```json 
{
    "newId": "some-new-id"
}
```

<b>Success response:</b><br />
Code `200`<br />
Content
```json
{
    "message": "Successfully updated subCommunity"
}
```

<b>Error response:</b><br />
Code `404`<br />
Content 
```json
{
  "error": "subCommunity does not exist: <id>"
}
```
<br />
