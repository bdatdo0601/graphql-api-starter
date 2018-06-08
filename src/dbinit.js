import mongoose from "mongoose";

// Configuration data
import configStore from "./config";

const main = async function() {
    try {
        await mongoose.connect(`${configStore.retrieve("/db/mongo/uri")}${configStore.retrieve("/db/mongo/dbName")}`);
        const connection = await mongoose.connection;
        await connection.createCollection("test");
        const collections = await connection.db.listCollections({}).toArray();
        console.log(collections);
        console.log("success");
        mongoose.connection.close();
    } catch (err) {
        console.log(err.message);
    }
};

main();
