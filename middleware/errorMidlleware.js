const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found"; // Fixed typo: "Resourse" to "Resource"
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : null, // Fixed typo: "NODE_URL" to "NODE_ENV"
  });
};

module.exports = { notFound, errorHandler };
