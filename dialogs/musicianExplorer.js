module.exports = function () {
    bot.dialog('/musicianExplorer', [
        function (session) {
            //generate facets
            getEraFacets(function (err, results) {
                if (err) {
                    console.log(err);
                } else if (results && results[0] && results[0]['value']) {
                    var choices = [];
                    results.forEach(function (result, i) {
                        choices.push(result['value'] + " (" + result.count + ")");
                    })
                }
                builder.Prompts.choice(session, "Which era of music are you interested in?", choices);
            })
        },
        function (session, results) {
            var era = results.response.entity;
            //Chooses just the genre - gets rid of the (number)
            era = era.split(' ')[0];
            
            
            filterByEra(era, function (err, results) {
                if (err) {
                    console.log(err);
                } else if (results && results['value'] && results['value'][0]) {
                    session.replaceDialog('/showResults', {results});
                } else {
                    session.endDialog("I couldn't find any musicians in that era :0");
                }
            })
        }
    ]);
}

