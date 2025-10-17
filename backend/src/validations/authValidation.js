const Joi = require("joi");

exports.register = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().max(50).required(),
});

exports.login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.facebook = Joi.object({
  accessToken: Joi.string().required(),
});
