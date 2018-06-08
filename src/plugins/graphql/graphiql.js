/**
 *  Copyright (c) 2015-present, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 *  @flow strict
 */

// Current latest version of GraphiQL.
const GRAPHIQL_VERSION = "0.11.11";

// Ensures string values are safe to be used within a <script> tag.
function safeSerialize(data) {
    return data ? JSON.stringify(data).replace(/\//g, "\\/") : "undefined";
}

/**
 * When express-graphql receives a request which does not Accept JSON, but does
 * Accept HTML, it may present GraphiQL, the in-browser GraphQL explorer IDE.
 *
 * When shown, it will be pre-populated with the result of having executed the
 * requested query.
 */
export default function(data) {
    const queryString = data.query;
    const variablesString = data.variables ? JSON.stringify(data.variables, null, 2) : null;
    const resultString = data.result ? JSON.stringify(data.result, null, 2) : null;
    const operationName = data.operationName;
    return `<!--\n  The request to this GraphQL server provided the header "Accept: text/html"\n  and as a result has been presented GraphiQL - an in-browser IDE for\n  exploring GraphQL.\n  If you wish to receive JSON, provide the header "Accept: application/json" or\n  add "&raw" to the end of the URL within a browser.\n  -->\n  <!DOCTYPE html>\n  <html>\n  <head>\n    <meta charset="utf-8" />\n    <title>GraphiQL</title>\n    <meta name="robots" content="noindex" />\n    <meta name="referrer" content="origin">\n    <style>\n      body {\n        height: 100%;\n        margin: 0;\n        overflow: hidden;\n        width: 100%;\n      }\n      #graphiql {\n        height: 98vh;\n      }\n      #authBox {\n        height: 2vh;\n      }\n      #authBoxTitle {\n        margin-right: 16px;\n      }\n      #authBoxInput {\n        width: 500px;\n      }\n    </style>\n    <link href="//cdn.jsdelivr.net/npm/graphiql@${GRAPHIQL_VERSION}/graphiql.css" rel="stylesheet" />\n    <script src="//cdn.jsdelivr.net/es6-promise/4.0.5/es6-promise.auto.min.js"></script>\n    <script src="//cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js"></script>\n    <script src="//cdn.jsdelivr.net/react/15.4.2/react.min.js"></script>\n    <script src="//cdn.jsdelivr.net/react/15.4.2/react-dom.min.js"></script>\n    <script src="//cdn.jsdelivr.net/npm/graphiql@${GRAPHIQL_VERSION}/graphiql.min.js"></script>\n  </head>\n  <body>\n    <div id="graphiql">Loading...</div>\n    <div id="authBox">\n      <span id="authBoxTitle">Auth Box</span><input id="authBoxInput" type="text" />\n    </div>\n    <script>\n      // Collect the URL parameters\n      var parameters = {};\n      window.location.search.substr(1).split('&').forEach(function (entry) {\n        var eq = entry.indexOf('=');\n        if (eq >= 0) {\n          parameters[decodeURIComponent(entry.slice(0, eq))] =\n            decodeURIComponent(entry.slice(eq + 1));\n        }\n      });\n      // Produce a Location query string from a parameter object.\n      function locationQuery(params) {\n        return '?' + Object.keys(params).filter(function (key) {\n          return Boolean(params[key]);\n        }).map(function (key) {\n          return encodeURIComponent(key) + '=' +\n            encodeURIComponent(params[key]);\n        }).join('&');\n      }\n      // Derive a fetch URL from the current URL, sans the GraphQL parameters.\n      var graphqlParamNames = {\n        query: true,\n        variables: true,\n        operationName: true\n      };\n      var otherParams = {};\n      for (var k in parameters) {\n        if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {\n          otherParams[k] = parameters[k];\n        }\n      }\n      var fetchURL = locationQuery(otherParams);\n      // Defines a GraphQL fetcher using the fetch API.\n      function graphQLFetcher(graphQLParams) {\n        let authorization = {};\n        const authValue = document.getElementById("authBoxInput").value\n        if (authValue !== "") \n          authorization = { 'Authorization': authValue }\n        return fetch(fetchURL, {\n          method: 'post',\n          headers: {\n            'Accept': 'application/json',\n            'Content-Type': 'application/json',\n            ...authorization\n          },\n          body: JSON.stringify(graphQLParams),\n          credentials: 'include',\n        }).then(function (response) {\n          return response.text();\n        }).then(function (responseBody) {\n          try {\n            return JSON.parse(responseBody);\n          } catch (error) {\n            return responseBody;\n          }\n        });\n      }\n      // When the query and variables string is edited, update the URL bar so\n      // that it can be easily shared.\n      function onEditQuery(newQuery) {\n        parameters.query = newQuery;\n        updateURL();\n      }\n      function onEditVariables(newVariables) {\n        parameters.variables = newVariables;\n        updateURL();\n      }\n      function onEditOperationName(newOperationName) {\n        parameters.operationName = newOperationName;\n        updateURL();\n      }\n      function updateURL() {\n        history.replaceState(null, null, locationQuery(parameters));\n      }\n      // Render <GraphiQL /> into the body.\n      ReactDOM.render(\n        React.createElement(GraphiQL, {\n          fetcher: graphQLFetcher,\n          onEditQuery: onEditQuery,\n          onEditVariables: onEditVariables,\n          onEditOperationName: onEditOperationName,\n          query: ${safeSerialize(
        queryString
    )},\n          response: ${safeSerialize(resultString)},\n          variables: ${safeSerialize(
        variablesString
    )},\n          operationName: ${safeSerialize(
        operationName
    )},\n        }),\n        document.getElementById('graphiql')\n      );\n    </script>\n  </body>\n  </html>`;
}
