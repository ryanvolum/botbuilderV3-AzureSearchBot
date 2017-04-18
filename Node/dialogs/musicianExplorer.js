const builder = require('botbuilder');
const searchHelper = require('../searchHelpers.js');
const messageHelper = require('../messageHelper.js');

// update this to be the name of your facet
const facetName = 'Era';

module.exports = {
    id: 'musicianExplorer',
    title: 'Musician Explorer',
    dialog: [
        (session) => {
            searchHelper.facetQuery(facetName, (err, result) => {
                if (err) {
                    console.log(`Error when faceting by ${facetName}: ${err}`);
                    session.endConversation(`Sorry, I ran into issues when talking to the server. Please try again.`);
                } else if (!result) {
                    session.endConversation(`I'm sorry, I couldn't find any to show you.`);
                } else {
                    const facetNames = [];
                    const buttons = [];
                    result.forEach(function (facet, i) {
                        facetNames.push(facet.value);
                        buttons.push(
                            builder.CardAction.imBack(session, facet.value, `${facet.value} (${facet.count})`)
                        );
                    });

                    // const message = new builder.Message(session);
                    const card = new builder.ThumbnailCard(session).buttons(buttons);
                    const message = new builder.Message(session).addAttachment(card);
                    card.title = `Which ${facetName} are you interested in?`;

                    //Prompts the user to select the era he/she is interested in
                    builder.Prompts.choice(session,
                        message,
                        facetNames
                    );
                }
            });
        },
        (session, results) => {
            //Chooses just the era name - parsing out the count
            const facetValue = results.response.entity;

            searchHelper.filterQuery(facetName, facetValue, (err, result) => {
                if (result) {
                    const message = messageHelper.getMusiciansCarousel(session, result);
                    session.endConversation(message);
                } else if (err) {
                    // error
                    console.log(`Error when filtering by ${facetValue}: ${err}`);
                    session.endConversation(`Sorry, I had an error when loading ${facetValue}`);
                } else {
                    // no results or error
                    session.endConversation(`I couldn't find any results in ${facetValue}.`);
                }
                session.reset('/');
            });
        }
    ]
};