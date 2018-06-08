const helloResolver = async (rootValue, args, context, operations) => {
    return "world";
};

export default {
    Query: {
        hello: helloResolver,
    },
};
