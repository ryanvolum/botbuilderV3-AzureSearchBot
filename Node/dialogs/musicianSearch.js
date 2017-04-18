module.exports = {
    id: 'musicianSearch',
    dialog: [
        (session) => {
            //Prompt for string input
            builder.Prompts.text(session, 'What musician are you searching for?');
        },
        (session, results) => {
            //Sets name equal to resulting input
            const name = results.response;

            const queryString = searchQueryStringBuilder(`search= ${name}`);
            performSearchQuery(queryString, (err, result) => {
                if (err) {
                    console.log(`Error when retrieving musicians: ${err}`);
                    session.endConversation(`Sorry, I couldn't load the data.`);
                } else if (result && result['value'] && result['value'][0]) {
                    //If we have results send them to the showResults dialog (acts like a decoupled view)
                    session.replaceDialog('showResults', { result });
                } else {
                    session.endConversation(`No musicians by the name '${name}' found`);
                }
            })
        }
    ]
}

