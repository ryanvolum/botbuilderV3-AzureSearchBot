const builder = require('botbuilder');
const searchHelper = require('../searchHelpers.js');

const facetName = 'Era';

module.exports = {
    id: 'musicianExplorer',
    dialog: [
        (session) => {
            // Syntax for faceting results by a facet name

            searchHelper.facetQuery('Era', (err, result) => {
                if (err) {
                    console.log(`Error when faceting by ${facetName}: ${err}`);
                    session.endConversation(`Sorry, I ran into issues when talking to the server. Please try again.`);
                } else if (!result) {
                    session.endConversation(`I'm sorry, I couldn't find any to show you.`);
                } else {
                    const facetNames = [];
                    //Pushes the name of each era into an array
                    result.forEach(function (facet, i) {
                        facetNames.push(`${facet['value']} (${facet.count})`);
                    });
                    //Prompts the user to select the era he/she is interested in
                    builder.Prompts.choice(session,
                        "Which era of music are you interested in?",
                        facetNames,
                        { listStyle: builder.ListStyle.button }
                    );
                }
            });
        },
        (session, results) => {
            //Chooses just the era name - parsing out the count
            const facetValue = results.response.entity.split(' ')[0];;

            //Syntax for filtering results by 'facet'. Note the $ in front of filter (OData syntax)
            // TODO: Update this to use a helper function
            var queryString = searchQueryStringBuilder(`$filter=${facetName} eq '${facetValue}'`);

            performSearchQuery(queryString, function (err, result) {
                if (result) {
                    // results found
                    session.replaceDialog('showResults', { result });
                } else if (err) {
                    // error
                    console.log(`Error when filtering by ${facetValue}: ${err}`);
                    session.endConversation(`Sorry, I had an error when loading ${facetValue}`);
                } else {
                    // no results or error
                    session.endConversation(`I couldn't find any results in ${facetValue}.`);
                }
            })
        }
    ]
};