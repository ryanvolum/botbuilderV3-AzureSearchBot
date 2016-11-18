In this demo I'll demonstrate how to use Azure Document DB, Azure Search and the Microsoft Bot Framework to build a bot that searches and filters over an underlying dataset.

More and more frequently we're seeing the value in bots that can reason over an underlying dataset. In these scenarios we often find that entity recognition in 
natural language processing falls short - NLP can only infer an entity if it has explicitly been trained on that entity before. 
Instead, we've found that Search can be a powerful tool in helping us build these conversational experiences. Search allows our bots to do two big things:

1. Search an underlying dataset with the advanced technology we've been building for years (fuzzy search, etc) 
2. Guide users through a conversation that filters the dataset down until there are few enough possible datapoints that it returns those to the users

I'm going to demonstrate how to create a simple bot that searches and filters over a dataset of classical musicians.

DocumentDB 
I'll start by noting the musicianData JSON file. Each JSON object is made up of four properties: musician name, era, description, and image url. Our goal will be to
allow users to quickly find a specific musician or see musicians by their different eras. Our dataset only contains 19 musicians, but you can imagine this approach being
scaled to thousands of products in a catalog or hundreds of events at a conference/music festival. Note: all of this data is licensed under Creative Commons.

Azure Search is capable of indexing data from several data sources including Document DB, Blob Storage, Table Storage and Azure SQL. We'll use Document DB as a demonstration. 

1. Create a Document DB database and collection. 
        Navigate to Azure Portal 
        Create Doc DB account
        Create collection/add new DB
2. Upload JSON data
Now that we've got our database and collection set up, let's go ahead and push our JSON data up. We can do this programatically, but for the
sake of simplicity I'm going to use the Document DB Data Migration Tool (documented here https://azure.microsoft.com/en-us/documentation/articles/documentdb-import-data/).
        Fill in source information
        Fill in target information
            Get connection strings from portal
            Be sure to add Database = DatabaseName; to your connection string
        Import Data


Once you've got the tool, navigate to the musician JSON data: 

    dtui1

Next, grab your connection strings from the portal and paste them in:

    dtui2

Then upload your data:

    dtui3

To see that our data has uploaded, we can go back to the portal, click query explorer and run the default query (SELECT * FROM c). 

3. Create Azure Search index
    Create an Azure Search service

        search1

    Import Data from your Document DB collection

        search2
    
    Create your Azure Search index
        Here's where the magic starts to happen. You can see that Azure Search has accessed our data and pulled in each parameter of the JSON objects. 
        Now we get to decide which of these parameters we want to search over, facet over, filter by and retrieve. Again we could generate our indeces programically,
        and in more complex use cases we would, but for the sake of simplicity we'll stick to the portal UI. Given that we want access to all of these properties
        we'll go ahead and make them all retrievable. We want to be able to facet (more details about faceting to come) and filter over musician's eras. Finally,
        we'll mark name as searchable so that our bot can search for musicians by their names. 
    
        search3

    Create your Azure Search indexer
        As our data is subject to change, we need to be able to reindex that data. Azure Search allows you to index on a schedule or on demand, but for this demo
        we'll index once only.

        search4

    Use the Search explorer
        We can verify that our index is properly functioning by using the Azure Search Explorer to enter example searches, filters and facets. This can be a very
        useful tool in testing out queries as you develop your bot. Note: If you enter a blank query the explorer should return all of your data. 
        
        Let's try three different queries:

        Frederic
            Given that our index searches over musician name, a search of "Frederic" returns the information for "Frederic Chopin" along with a search score. The 
            search score represents the confidence that Azure Search has regarding each result. 
            search5
            If we search instead for "Johannes", we will get two pertinent results: one for Johannes Sebastian Bach and the other for Johannes Brahms

        facet=Era
            Faceting allows us to see the different examples of a parameter and their corresponding counts. You can see here that the JSON response from the 
            search API tells us that there are 11 Romantic musicians, 3 Classical musicians, 2 Baroque musicians and 1 Modernist musician:
                search7
            This information will allow us to guide the conversation our bot can have. If a user wishes to see musicians by era, our bot can quickly and efficiently 
            find all the eras that are possible and present them as options to the user. 
        $filter=Era eq 'Romantic'
            search6

4. Build your Bot

The bot I will demonstrate is built in Node.js. The bot framework SDK is also available in C# - for a run through of a C# search bot check out Pablo Castro's
real estate bot <INSERT-LINK>.
This bot will be fairly simple, but if you're new to bot building several of the concepts might be foreign. For a quick ramp up check out aka.ms/botcourse,
specifically the sections about setting up a node project, using cards and using dialogs. 

All of our connector logic is being stored in the connectorSetup.js. Here's where you would enter your appId and appPassword if you were going to 
make this bot live or connect it to a non-emulator channel. 

Let's dive into the dialog logic now:

All messages get routed into the root ('/') dialog. From here, we replace the dialog with the promptButtons dialog. 
```javascript
bot.dialog('/', [
    function (session) {
        session.replaceDialog('/promptButtons');
    }
]);
```
In the promptButtons dialog we use the Prompts.choice method to prompt the user with our choices (in this case Musician Explorer and Musician Search) defined in the `choices` array.
Once the user answers, we move into the next function which uses a switch statement to decide which dialog to route us to. Note that the musicianExplorer and 
musicianSearch dialogs each have their own .js file in the 'dialogs' folder and were included at the start of app.js.

```javascript
bot.dialog('/promptButtons', [
    function (session) {
        var choices = ["Musician Explorer", "Musician Search"]
        builder.Prompts.choice(session, "How would you like to explore AI World?", choices);
    },
    function (session, results) {
        if (results.response) {
            var selection = results.response.entity;
            // route to corresponding dialogs
            switch (selection) {
                case "Musician Explorer":
                    session.replaceDialog('/musicianExplorer');
                    break;
                case "Musician Search":
                    session.replaceDialog('/musicianSearch');
                    break;
                default:
                    session.reset('/');
                    break;
            }
        }
    }
]);
```
The musician search dialog first prompts the user to type in the name of the musician that he/she is looking for:

```javascript
bot.dialog('/musicianSearch', [
    function (session) {
        builder.Prompts.text(session, "Type in the name of the musician you are searching for:");
    },
```

It then then calls a helper method, `searchByName` (found in our searchHelpers.js file), to query our Azure Search index. If it gets results from the query it routes us 
to showResults, which we can think of as a view layer. Note that we pass {results} to the showResults dialog. The showResults dialog
receives these as a property as part of an `args` parameter which we will explore later. If the search renders no results we send
 `session.endDialog("No musicians by the name \'" + name + "\' found");` to the user. 

```javascript
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
```
Note that our error handling for this example simply logs the error to console - in a real world bot we would want to be more involved in 
our error handling. 

Our musician explorer is a bit more involved. First it gathers our era facets and prompts the user to choose which one he/she is interested in. 
Again we're calling a search helper method, `getEraFacets`, which gives us a JSON response of all of the eras of musicians that are represented 
in our index:

```javascript
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
```

Once the user selects the era that they are interested in we call a filter query, `filterByEra`, passing the 
era that the user wishes to filter over:

```javascript
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
```
This gives us all of the musicians that map to the era the user chose. Once we have results, we again send them to our showResults dialog.

Our showResults dialog receives the results from the musicianExplorer and musicianSearch dialogs as properties of the `args` parameter. 
It then creates a new message with a carousel layout, `var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);`, 
and adds a hero card attachment with the name, era, search score, description and image for each musician.

```javascript
        function (session, args) {
            var msg = new builder.Message(session).attachmentLayout(builder.AttachmentLayout.carousel);
            if (args.results) {
                args.results['value'].forEach(function (musician, i) {
                    var img = musician.imageURL;
                    msg.addAttachment(
                        new builder.HeroCard(session)
                            .title(musician.Name)
                            .subtitle("Era: " + musician.Era + " | " + "Search Score: " + musician['@search.score'])
                            .text(musician.Description)
                            .images([builder.CardImage.create(session, img)])
                    );
                })
                session.endDialog(msg);
            }
        }
    ])
```

