export const ApplicationException = ({
  message = "error",
  options = { cause: { status: 400 } },
}) => {
  throw new Error(message, options);
};

export const ConflictException = (message = "conflict error", issues = {}) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 409, issues },
    },
  });
};
export const TooManyRequestException = (message = "Too many request exception", issues = {}) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 429, issues },
    },
  });
};
export const NotFoundException = (message = "Not found", issues = {}) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 404, issues },
    },
  });
};
export const BadException = (message = "Bad request exception", issues = {}) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 400, issues },
    },
  });
};
export const UnAuthorizedException = (
  message = "UnAuthorized",
  issues = {},
) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 401, issues },
    },
  });
};
export const ForbiddenException = (message = "Forbidden", issues = {}) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 403, issues },
    },
  });
};
