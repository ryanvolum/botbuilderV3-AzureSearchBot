require('./config.js')();
require('./connectorSetup.js')();
require('./searchHelpers.js')();
require('./dialogs/results.js')();
require('./dialogs/musicianExplorer.js')();
require('./dialogs/musicianSearch.js')();


const request = require('request');
const restify = require('restify');
const builder = require('botbuilder');

//If testing via the emulator, no need for appId and appPassword. If publishing, enter appId and appPassword here 
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID ? process.env.MICROSOFT_APP_ID : '',
    appPassword: process.env.MICROSOFT_APP_PASSWORD ? process.env.MICROSOFT_APP_PASSWORD : '',
    gzipData: true
});

// create the bot
const bot = new builder.UniversalBot(connector, (session) => session.replaceDialog('promptButtons'));

bot.dialog('promptButtons', [
    (session) => {
        const choices = ['Musician Explorer', 'Musician Search'];
        builder.Prompts.choice(session, 
            'How would you like to explore the classical music bot?',
            choices, 
            { listStyle: builder.ListStyle.button }
        );
    },
    (session, results) => {
        if (results.response) {
            const selection = results.response.entity;
            // route to corresponding dialogs
            switch (selection) {
                case "Musician Explorer":
                    session.replaceDialog('musicianExplorer');
                    break;
                case "Musician Search":
                    session.replaceDialog('musicianSearch');
                    break;
                default:
                    session.reset('/');
                    break;
            }
        }
    }
]);

bot.dialog('musicianExplorer', require('./dialogs/musicianExplorer.js'));

// reset stuck dialogs in case of versioning
bot.use(builder.Middleware.dialogVersion({ version: 0.2, resetCommand: /^reset/i }));


// Setup Restify Server
const server = restify.createServer();
server.post('/api/messages', connector.listen());

server.listen(process.env.port || 3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});



