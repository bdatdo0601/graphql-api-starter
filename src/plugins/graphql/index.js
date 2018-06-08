/**
 * const dependencies
 */
import { badRequest, methodNotAllowed } from "boom";
import { Stream } from "stream";
import { Source, parse, validate, execute, formatError, getOperationAST, specifiedRules } from "graphql";
import { version } from "../../../package.json";
import renderGraphiQL from "./graphiql";
import accepts from "accepts";

/**
 * Define helper: get options = require(object/function
 */
const getOptions = async (options, request) => {
    // Get options
    const optionsData = await Promise.resolve(typeof options === "function" ? options(request) : options);
    return optionsData;
};

/**
 * Define helper: parse payload
 */
const parsePayload = async request => {
    // Read stream
    const result = await new Promise(resolve => {
        if (request.body instanceof Stream) {
            let data = "";
            request.body.on("data", chunk => {
                data += chunk;
            });
            request.body.on("end", () => resolve(data));
        } else if (request.body) {
            resolve(JSON.stringify(request.body));
        } else {
            resolve("{}");
        }
    });
    // Return normalized payload
    let formattedResult = null;
    if (request.headers["content-type"] === "application/graphql") {
        formattedResult = { query: result };
    } else {
        formattedResult = JSON.parse(result);
    }
    return formattedResult;
};

/**
 * Define helper: get GraphQL parameters = require(query/payload
 */
const getGraphQLParams = (request, payload = {}, logUtil) => {
    // GraphQL Query string.
    const query = request.query.query || payload.query;

    // Parse the variables if needed.
    let variables = request.query.variables || payload.variables;
    if (variables && typeof variables === "string") {
        try {
            variables = JSON.parse(variables);
        } catch (error) {
            logUtil.warn("Variables are invalid JSON.");
            throw badRequest("Variables are invalid JSON.");
        }
    }

    // Name of GraphQL operation to execute.
    const operationName = request.query.operationName || payload.operationName;

    // Return params
    return { query, variables, operationName };
};

/**
 * Define helper: determine if GraphiQL can be displayed.
 */
const canDisplayGraphiQL = (request, data) => {
    // If `raw` exists, GraphiQL mode is not enabled.
    const raw = request.query.raw !== undefined || data.raw !== undefined;
    // Allowed to show GraphiQL if not requested as raw and this request
    // prefers HTML over JSON.
    const accept = accepts(request.raw);
    return !raw && accept.type(["json", "html"]) === "html";
};

/**
 * Define helper: execute query and create result
 */
const createResult = async (
    { context, operationName, query, request, rootValue, schema, showGraphiQL, validationRules, variables },
    logUtil
) => {
    // If there is no query, but GraphiQL will be displayed, do not produce
    // a result, otherwise return a 400: Bad Request.
    if (!query) {
        if (showGraphiQL) {
            return null;
        }
        logUtil.warn("Query String is Empty");
        throw badRequest("Must provide query string.");
    }

    // GraphQL source.
    const source = new Source(query, "GraphQL request");

    // Parse source to AST, reporting any syntax error.
    let documentAST;
    try {
        documentAST = parse(source);
    } catch (syntaxError) {
        // Return 400: Bad Request if any syntax errors errors exist.
        logUtil.warn("Invalid query string");
        throw badRequest("Syntax error", [syntaxError]);
    }

    // Validate AST, reporting any errors.
    const validationErrors = validate(schema, documentAST, validationRules);
    if (validationErrors.length > 0) {
        // Return 400: Bad Request if any validation errors exist.
        logUtil.warn("Validation Errors");
        throw badRequest("Validation error", validationErrors);
    }

    // Only query operations are allowed on GET requests.
    if (request.raw.method === "GET") {
        // Determine if this GET request will perform a non-query.
        const operationAST = getOperationAST(documentAST, operationName);
        if (operationAST && operationAST.operation !== "query") {
            // If GraphiQL can be shown, do not perform this query, but
            // provide it to GraphiQL so that the requester may perform it
            // themselves if desired.
            if (showGraphiQL) {
                return null;
            }

            // Otherwise, report a 405: Method Not Allowed error.
            logUtil.warn("Invalid Method Type (need POST)");
            throw methodNotAllowed(`Can only perform a ${operationAST.operation} operation = require a POST request`);
        }
    }

    // Perform the execution, reporting any errors creating the context.
    try {
        return await execute(schema, documentAST, rootValue, { ...context, request }, variables, operationName);
    } catch (contextError) {
        logUtil.warn("Context Error");
        // Return 400: Bad Request if any execution context errors exist.
        throw badRequest("Context error", [contextError]);
    }
};

/**
 * Define handler
 */
const handler = (options = {}, logUtil) => async (request, reply) => {
    let errorFormatter = formatError;
    try {
        // Get GraphQL options given this request.
        const {
            schema,
            context,
            rootValue,
            graphiql,
            formatError: customFormatError,
            validationRules: additionalValidationRules,
        } = await getOptions(options, request);

        let validationRules = specifiedRules;
        if (additionalValidationRules) {
            validationRules = validationRules.concat(additionalValidationRules);
        }

        if (customFormatError) {
            errorFormatter = customFormatError;
        }

        // GraphQL HTTP only supports GET and POST methods.
        if (request.raw.method !== "GET" && request.raw.method !== "POST") {
            logUtil.warn("GraphQL only supports GET and POST requests.");
            throw methodNotAllowed("GraphQL only supports GET and POST requests.");
        }

        // Parse payload
        const payload = await parsePayload(request);

        // Can we show graphiQL?
        const showGraphiQL = graphiql && canDisplayGraphiQL(request, payload);

        // Get GraphQL params = require(the request and POST body data.
        const { query, variables, operationName } = getGraphQLParams(request, payload, logUtil);

        // Create the result
        const result = await createResult(
            {
                context,
                operationName,
                query,
                request,
                rootValue,
                schema,
                showGraphiQL,
                validationRules,
                variables,
            },
            logUtil
        );

        // Format any encountered errors.
        if (result && result.errors) {
            result.errors = result.errors.map(errorFormatter);
        }
        // If allowed to show GraphiQL, present it instead of JSON.
        if (showGraphiQL) {
            reply
                .code(200)
                .type("text/html")
                .send(renderGraphiQL({ query, variables, operationName, result }));
        } else {
            // Otherwise, present JSON directly.
            reply
                .code(200)
                .type("application/json")
                .send(result);
        }
    } catch (error) {
        // Return error, picking up Boom overrides
        const { statusCode = 500 } = error.output;
        const errors = error.data || [error];
        reply.code(statusCode).send({ errors: errors.map(errorFormatter) });
    }
};

/**
 * Define plugin
 */
function register(fastify, options = {}, next) {
    const { route, query } = options;
    const logUtil = fastify.log;

    if (!route || !query) {
        logUtil.error("Invalid Configuration");
        throw new Error("Route or Query not provided");
    }

    fastify.route({
        method: ["GET", "POST"],
        url: route.path,
        config: route.config,
        handler: handler(query, logUtil),
    });

    // Done
    next();
}

/**
 * Define plugin attributes
 */
register.attributes = { name: "graphql", version };

/**
 * Export plugin
 */
export default register;
