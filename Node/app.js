// load environmental variables
require('dotenv').config();

const request = require('request');
const restify = require('restify');
const builder = require('botbuilder');

const dialogs = {};
dialogs.musicianExplorer = require('./dialogs/musicianExplorer.js');
dialogs.musicianSearch = require('./dialogs/musicianSearch.js');


//If testing via the emulator, no need for appId and appPassword. If publishing, enter appId and appPassword here 
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD,
    gzipData: true
});

// create the bot
const bot = new builder.UniversalBot(connector, (session) => {
    const message = new builder.Message(session);
    message.text = 'How would you like to search?';
    message.attachments([
        new builder.ThumbnailCard(session)
            .buttons([
                builder.CardAction.imBack(
                    session, dialogs.musicianExplorer.title, dialogs.musicianExplorer.title
                ),
                builder.CardAction.imBack(
                    session, dialogs.musicianSearch.title, dialogs.musicianSearch.title
                )
            ])
            .title('How would you like to search?')
    ]);
    session.endConversation(message);
});

// register the two dialogs
// musicianExplorer will provide a facet or category based search
bot.dialog(dialogs.musicianExplorer.id, dialogs.musicianExplorer.dialog)
    .triggerAction({ matches: new RegExp(dialogs.musicianExplorer.title, 'i') });

// musicianSearch will provide a classic search
bot.dialog(dialogs.musicianSearch.id, dialogs.musicianSearch.dialog)
    .triggerAction({ matches: new RegExp(dialogs.musicianSearch.title, 'i') });

// reset stuck dialogs in case of versioning
bot.use(builder.Middleware.dialogVersion({ version: 0.2, resetCommand: /^reset/i }));

// Setup Restify Server
const server = restify.createServer();
server.post('/api/messages', connector.listen());

server.listen(3978, () => {
    console.log('%s listening to %s', server.name, server.url);
});