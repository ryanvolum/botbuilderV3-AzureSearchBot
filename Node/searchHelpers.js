const request = require('request');
const rootQueryString = `https://${process.env.AZURE_SEARCH_NAME}.search.windows.net/indexes/${process.env.AZURE_INDEX_NAME}/docs?api-key=${process.env.AZURE_SEARCH_KEY}&api-version=2016-09-01`

module.exports = {
    facetQuery: (facet, callback) => {
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
        const queryString = `${rootQueryString}&$filter=${filterName} eq '${filterValue}'`;

        request(queryString, (error, response, body) => {
            if(error) {
                callback(error, null);
            } else {
                const result = JSON.parse(body);
                if(result.value && result.value.length > 0) {
                    callback(null, result.value);
                } else {
                    callback(null, null);
                }
            }
        });
    },
    searchQuery: (keyword, callback) => {
        const queryString = `${rootQueryString}&search=${keyword}`;
        request(queryString, (error, response, body) => {
            if(error) {
                callback(error, null);
            } else {
                const result = JSON.parse(body);
                if(result && result.value) {
                    callback(null, result.value);
                } else {
                    callback(null, null);
                }
            }
        });
    }
}