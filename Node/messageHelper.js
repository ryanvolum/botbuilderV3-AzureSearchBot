const builder = require('botbuilder');

module.exports = {
    getMusiciansCarousel: (session, items) => {
        // results found
        var message = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
        items.forEach((musician) => {
            // custom card for musician
            // update with your specific fields for output
            message.addAttachment(
                new builder.HeroCard(session)
                    .title(musician.Name)
                    .subtitle("Era: " + musician.Era + " | " + "Search Score: " + musician['@search.score'])
                    .text(musician.Description)
                    .images([builder.CardImage.create(session, musician.imageURL)])
            );
        })
        return message;
    }
}