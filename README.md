# GraphQL API Starter Framework

A base framework to create an API with GraphQL compatible. The database is based on MongoDB but it could easily replaced to other database of choice.  

## Pre-requirements

- [Node](https://nodejs.org/en/) (> v8.0.0) **NOTE: Untested with v10.0.0**
- [Yarn Package Manager](https://yarnpkg.com/en/)

<!-- - [MongoDB](https://www.mongodb.com/) (`brew install mongodb`) -->

## Setup

### Local Host setup

Once the project cloned into local machine, simply execute `yarn` and the package manager will install all necessary dependencies for the project.

The project also incorporated with JWT so make sure to have an `jwtSecret` environment variable (either through CLI or `.env` file). Please refer to `.sampleenv` for example. 

When all dependencies are installed and environment variables are setup, execute `yarn start` and the server will be up at `http://localhost:5000/`.

## Develop

GraphQL endpoint is available at `http://localhost:5000/graphql`. In development environment, the endpoint will expose GraphiQL to allow quick request testing. This will be disable in production

### Commands

<!-- - `yarn init-db`: initialize the local database (**NOTE: all data in local database will be loss once executed**)
- `yarn init-db-production`: similar to `yarn init-db` but for production -->
- `yarn start`: start the development version (with development variables) of the API
- `yarn start-production`: start the production version of the API
- `yarn clean`: clean up build folder, use when you want to create a fresh production version of the project
- `yarn build-server`: build a production version of the project
- `yarn build`: Combination of `yarn clean` and `yarn build-server`

### Voyager

[Voyager](https://github.com/APIs-guru/graphql-voyager) is a great tool to visualize GraphQL schema. The project already implemented it and can be access in `/voyager` route.

## File Structures

This provides a brief overview of how the project is structured.

```file
├── README.md                                   # Important information regarding to the project
├── package.json                                # project's info and dependencies declaration
├── src/
│   ├── config.js                               # configuration to separate data between dev and production
│   ├── db/
│   │   └── models/                             # models for objects(documents) store in data
│   ├── dbLoader/                               # hold code to help batching request to database
│   ├── dbinit.js                               # database initialization script
│   ├── graphql/
│   │   ├── errors.js                           # GraphQL Errors Response
│   │   ├── index.js
│   │   ├── resolvers/                          # GraphQL Resolvers
│   │   │   ├── mutation/
│   │   │   ├── query/
│   │   │   └── typeDefs/
│   │   └── typeDefs/                           # GraphQL Type Definitions
│   ├── index.js                                # Starting point of the project
│   └── plugins/                                # Fastify Custom Plugins
│       ├── graphql/
│       └── voyager/
```
