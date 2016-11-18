module.exports = function () {
    bot.dialog('/musicianSearch', [
        function (session) {
            builder.Prompts.text(session, "Type in the name of the musician you are searching for:");
        },
        function (session, results) {
            var name = results.response;
            searchByName(name, function (err, results) {
                if(err){
                    console.log(err);
                } else if(results && results['value'] && results['value'][0]){
                    session.replaceDialog('/showResults', {results});
                } else {
                    session.endDialog("No musicians by the name \'" + name + "\' found");
                }
            })
        }
    ]);
}

