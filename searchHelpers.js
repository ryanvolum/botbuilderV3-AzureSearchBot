module.exports = function () {
    global.request = require('request');

    global.searchQueryStringBuilder = function (query) {
        //process.env variables defined in Azure if deployed to a web app. For testing, place IDs and Keys inline
        var searchName = process.env.AZURE_SEARCH_NAME ? process.env.AZURE_SEARCH_NAME : "botsearchdemo";
        var indexName = process.env.INDEX_NAME ? process.env.AZURE_SEARCH_NAME : "musicianindex";
        var searchKey = process.env.INDEX_NAME ? process.env.AZURE_SEARCH_KEY : "E96AC4DD9C655A6D490E3CF6A4CB947E";

        var queryString = 'https://' + searchName + '.search.windows.net/indexes/' + indexName + '/docs?api-key=' + searchKey + '&api-version=2015-02-28&' + query;
        return queryString;
    }

    global.performSearchQuery = function (queryString, callback) {
        request(queryString, function (error, response, body) {
            if (!error && response && response.statusCode == 200) {
                var result = JSON.parse(body);
                if (result) {
                    callback(null, result);
                }
            } else {
                callback(error, null);
            }
        })
    }
    global.getEraFacets = function (callback) {
        var queryString = 'https://' + searchName + '.search.windows.net/indexes/' + indexName + '/docs?api-key=' + searchKey + '&api-version=2015-02-28&facet=Era';
        request(queryString, function (error, response, body) {
            if (!error && response && response.statusCode == 200) {
                var result = JSON.parse(body);
                if (result && result['@search.facets'] && result['@search.facets'].Era) {
                    callback(null, result['@search.facets'].Era);
                }
            } else {
                callback(error, null);
            }
        })
    }

    global.filterByEra = function (era, callback) {
        var queryString = searchQueryStringBuilder("$filter=Era eq ' + '\'' + era + '\''");
        request(queryString, function (error, response, body) {
            if (!error && response && response.statusCode == 200) {
                var result = JSON.parse(body);
                if (result) {
                    callback(null, result);
                }
            } else {
                callback(error, null);
            }
        })
    }

    global.searchByName = function (name, callback) {
        var queryString = 'https://' + searchName + '.search.windows.net/indexes/' + indexName + '/docs?api-key=' + searchKey + '&api-version=2015-02-28&search= ' + name;
        request(queryString, function (error, response, body) {
            if (!error && response && response.statusCode == 200) {
                var result = JSON.parse(body);
                if (result) {
                    callback(null, result);
                }
            } else {
                callback(error, null);
            }
        })
    }
}
