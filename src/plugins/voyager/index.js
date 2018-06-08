import { version } from "../../../package.json";
import renderVoyagerPage from "./voyager";
import accepts from "accepts";

/**
 * Define helper: determine if GraphiQL can be displayed.
 */
const canDisplayVoyager = request => {
    // If `raw` exists, GraphiQL mode is not enabled.
    const raw = request.query.raw !== undefined;
    // Allowed to show GraphiQL if not requested as raw and this request
    // prefers HTML over JSON.
    const accept = accepts(request.raw);
    return !raw && accept.type(["json", "html"]) === "html";
};

/**
 * Define handler
 */
const handler = (options = {}, logUtil) => async (request, reply) => {
    try {
        // Can we show graphiQL?
        const canShowVoyager = canDisplayVoyager(request);

        if (options.endpointUrl === undefined) {
            logUtil.error("No Endpoint provided");
            throw new Error("No Endpoint provided");
        }

        // If allowed to show GraphiQL, present it instead of JSON.
        if (canShowVoyager) {
            reply
                .code(200)
                .type("text/html")
                .send(renderVoyagerPage(options));
        } else {
            // Otherwise, present JSON directly.
            reply.code(403).send({ message: "Environment Error: Can't display" });
        }
    } catch (error) {
        // Return error, picking up Boom overrides
        const { statusCode = 500 } = error.output;
        const errors = error.data || [error];
        reply.code(statusCode).send({ errors: "Voyager Error" });
    }
};

/**
 * Define plugin
 */
function register(fastify, options = {}, next) {
    const { route, voyagerOptions } = options;
    const logUtil = fastify.log;

    if (!route || !voyagerOptions) {
        logUtil.error("Invalid Configuration");
        throw new Error("Route or Voyager Options were not provided");
    }

    fastify.route({
        method: ["GET", "POST"],
        url: route.path,
        config: route.config,
        handler: handler(voyagerOptions, logUtil),
    });

    // Done
    next();
}

/**
 * Define plugin attributes
 */
register.attributes = { name: "voyager-fastify", version };

/**
 * Export plugin
 */
export default register;
