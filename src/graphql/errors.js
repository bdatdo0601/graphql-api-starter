import { createError } from "apollo-errors";

const UnknownError = createError("UnknownError", {
    message: "It's appear that there is something wrong with our server",
});

export default {
    UnknownError,
};
