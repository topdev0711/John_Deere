import { createPostParams } from './apiHelper'

const findUsabilityDetails = async body => {
  const response = await fetch(`/api/usability`, createPostParams(body));
  return response.json();
}

module.exports = { findUsabilityDetails };
