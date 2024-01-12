import { getParams } from './apiHelper'

const getUserInfo = async racfId => {
  const response = await fetch(`/api/users/${racfId}`, getParams);
  const responseMessage = await response.json();
  if(!response.ok) throw new Error(responseMessage.error);
  return responseMessage;
};

module.exports = { getUserInfo };
