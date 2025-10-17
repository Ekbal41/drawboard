const MESSAGE_PAGE_URL = `${process.env.FRONTEND_URL}/message`;

const redirectWithMsg = (res, msg) => {
  const redirectUrl = `${MESSAGE_PAGE_URL}?msg=${encodeURIComponent(msg)}`;
  return res.redirect(redirectUrl);
};

module.exports = {
  redirectWithMsg,
};
