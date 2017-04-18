module.exports = function () {
    global.request = require('request');

    global.searchQueryStringBuilder = function (query) {
        return queryString + query;
    }
}


const request = require('request');
const rootQueryString = ``

module.exports = {
    
    facetQuery: (facet, callback) => {
        checkConfig();

        const queryString = `${rootQueryString}&facet=${facet}`;
        request(queryString, (error, response, body) => {
            if(error) {
                callback(error, null);
            } else {
                const result = JSON.parse(body);
                if(!result || !result['@search.facets'] || !result['@search.facets'][facet]) {
                    // No items for that facet found
                    callback(null, null);
                } else {
                    callback(null, result['@search.facets'][facet]);
                }
            }
        });
    },
    filterQuery: (filterName, filterValue, callback) => {
        const queryString = `$filter=${filterName} eq '${filterValue}'`;

        request(queryString, (error, response, body) => {
            if(error) {
                callback(error, null);
            } else if(!result || !result['value'] || !result['value'][0]) {
                // no items found
                callback(null, null);
            } else {
                callback(null, result['value']);
            }
        });
    },
    performSearchQuery: (queryString, callback) => {

        request(queryString, (error, response, body) => {
            if (!error && response && response.statusCode === 200) {
                const result = JSON.parse(body);
                callback(null, result);
            } else {
                callback(error, null);
            }
        })
    },
    checkConfig: () => {
        if (!rootQueryString)
            throw 'Azure Search configuration information missing. Please set environmental variables in .env or on the application.';
    }
}