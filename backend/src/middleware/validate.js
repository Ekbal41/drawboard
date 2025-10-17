module.exports = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      convert: true,
    });

    if (error) {
      const errorsObj = error.details.reduce((acc, detail) => {
        acc[detail.path[0]] = detail.message;
        return acc;
      }, {});

      return res.status(400).json({
        status: "fail",
        errors: errorsObj,
      });
    }

    req.body = value;
    next();
  };
};
