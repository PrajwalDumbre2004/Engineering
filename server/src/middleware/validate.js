// Validates req.body against a zod schema; ZodError is turned into a 400 by the error handler.
export const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body);
  next();
};
