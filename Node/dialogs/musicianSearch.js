const builder = require('botbuilder');
const searchHelper = require('../searchHelpers.js');
const messageHelper = require('../messageHelper.js');

module.exports = {
    id: 'musicianSearch',
    title: 'Musician Search',
    dialog: [
        (session) => {
            //Prompt for string input
            builder.Prompts.text(session, 'Who are you searching for?');
        },
        (session, results) => {
            //Sets name equal to resulting input
            const keyword = results.response;

            searchHelper.searchQuery(keyword, (err, result) => {
                if (err) {
                    console.log(`Search query failed with ${err}`);
                    session.endConversation(`Sorry, I had an error when talking to the server.`);
                } else if (result && result.length > 0) {
                    const message = messageHelper.getMusiciansCarousel(session, result);
                    session.endConversation(message);
                } else {
                    const message = "I couldn't find any musician by that name";
                    session.endConversation(message);
                }
                session.reset('/');
            });
        }
    ]
}

