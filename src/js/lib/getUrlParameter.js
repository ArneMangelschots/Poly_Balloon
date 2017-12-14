const getUrlParameter = name => {
  name = name.replace(/[\[]/, `\\[`).replace(/[\]]/, `\\]`);
  const regex = new RegExp(`[\\?&]${  name  }=([^&#]*)`);
  const results = regex.exec(location.search);
  return results === null ? false : decodeURIComponent(results[1].replace(/\+/g, ` `));
};

export default getUrlParameter;
