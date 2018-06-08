import Confidence from "confidence";
import dotenv from "dotenv";

dotenv.config();

const document = Object.freeze({
    logger: {
        $filter: "env",
        production: false,
        $default: true,
    },
    jwtSecret: process.env.jwtSecret,
    db: {
        mongo: {
            uri: {
                $filter: "env",
                production: process.env.MONGODB_URI,
                $default: "mongodb://localhost:27017/",
            },
            dbName: {
                $filter: "env",
                production: process.env.MONGODB_NAME,
                $default: "ChefferDB",
            },
        },
    },
});

const store = new Confidence.Store();

store.load(document);

const criteria = Object.freeze({
    env: process.env.NODE_ENV,
});

const retrieve = key => store.get(key, criteria);

export default {
    retrieve,
};
