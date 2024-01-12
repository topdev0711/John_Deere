const createPostParams = body => ({
  credentials: 'same-origin',
  method: 'POST',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'},
  body: JSON.stringify(body)
});

async function getAccessibleDatasets(entitlements) {
  const res = await fetch(`/api/accessible-datasets`, createPostParams(entitlements));
  return res.json();
}

module.exports = { getAccessibleDatasets }
