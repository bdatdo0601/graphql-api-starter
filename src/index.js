import Fastify from "fastify";
import { GraphQLError } from "graphql";
import { formatError } from "apollo-errors";
import fastifyJWTPlugin from "fastify-jwt";

// Configuration data
import configStore from "./config";

// Database
import Loader from "./dbLoader";

//Plugins
import GraphQLFastifyPlugin from "./plugins/graphql";
import VoyagerFastifyPlugin from "./plugins/voyager";

import Errors from "./graphql/errors";
import Schema from "./graphql";

const loggerConfig = {
    level: "info",
    prettyPrint: true,
};

const fastify = Fastify({
    logger: configStore.retrieve("/logger") ? loggerConfig : false,
});

const errorFormatter = error => {
    let e = formatError(error);
    if (e instanceof GraphQLError) {
        e = formatError(
            new Errors.UnknownError({
                data: {
                    originalMessage: e.message,
                    originalError: e.name,
                },
            })
        );
    }

    return e;
};

fastify
    .register(fastifyJWTPlugin, {
        secret: configStore.retrieve("/jwtSecret"),
    })
    .after(err => {
        if (err) throw err;
        fastify.register(GraphQLFastifyPlugin, {
            query: {
                schema: Schema,
                graphiql: true,
                formatError: errorFormatter,
                context: {
                    Loader,
                    JWTUtils: fastify.jwt,
                },
            },
            route: {
                path: "/graphql",
            },
        });
        fastify.register(VoyagerFastifyPlugin, {
            route: {
                path: "/voyager",
            },
            voyagerOptions: {
                endpointUrl: "/graphql",
            },
        });
    });

// Run the server!
const start = async () => {
    try {
        await fastify.listen(process.env.PORT || 5000, "0.0.0.0");
        fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
