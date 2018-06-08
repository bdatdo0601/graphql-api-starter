import { join } from "path";
import { makeExecutableSchema } from "graphql-tools";
import resolvers from "./resolvers";

import typeDefs from "./typeDefs/rootSchema.graphql";

export default makeExecutableSchema({
    typeDefs,
    resolvers,
});
