var builder = require('botbuilder');
var restify = require('restify');
var search = require('./search.js');
var specialChars = require('underscore');


var connector = new builder.ChatConnector();
var bot = new builder.UniversalBot(connector);
var types = ['Information session', 'Workshop', 'Lecture', 'Conference', 'Seminar', 'Open house', 'Reception', 'Performance', 'Thesis defence', 'Reunion', 'Meeting']

// LUIS connection
var recognizer = new builder.LuisRecognizer("https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/deecd678-4dca-4736-bc93-f3982e1ae346?subscription-key=8a9b1636e26d4a7a8788c900a0aa98e6&verbose=true");
bot.recognizer(recognizer);

var dialog =  new builder.IntentDialog({recognizers:[recognizer]});



bot.dialog('/',dialog);
dialog.matches('Greeting', [
    // Search input  
    function (session,result, args) {
      //  if (session.message.text.toLowerCase() == 'search') {
        session.send("Hey! I'm the WatsLit Bot! I know everything about what's lit at UWaterloo! To start off, here are some trending events: ");
        
        var query = result.response;
        search.searchEvents(null,null, null, function (response) {
            session.dialogData.property = null;
            
            // display the cards
            var cards = []; 
            for(var i=0; i<10; ++i){
                console.log(response[i]);
                cards.push(
                    new builder.HeroCard(session)
            .title(specialChars.unescape(response[i].title).replace("&#039;", "'"))
            .subtitle("This program starts at: " + response[i].times[0].start)
            .text('This event is run by: ' + response[i].site_name)
            .images([
                builder.CardImage.create(session, 'https://raw.githubusercontent.com/PragashSiva/bart/master/Null-Photo-Image.jpg')
            ])
            .buttons([
                builder.CardAction.openUrl(session, response[i].link , 'Learn More')
            ])



                );
            }

            // create reply with Carousel AttachmentLayout
            var reply = new builder.Message(session)
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(cards);

            session.send(reply);
           
            builder.Prompts.text(session, "Try a type of event (e.g. workshops, gala)");
        })
    }
]);

dialog.matches('Event Search',[
       // Create the carousel
    function (session, result, next) {
        var query = result.response;
         builder.Message(session, "Here's what I found.");
        
        var query = builder.EntityRecognizer.findBestMatch();
        var time = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.datetime.date');
        var time = builder.EntityRecognizer.resolveTime(time.entity);
        if (cityEntity) {
            // city entity detected, continue to next step
            session.dialogData.searchType = 'city';
            next({ response: cityEntity.entity });
        } else if (airportEntity) {
            // airport entity detected, continue to next step
            session.dialogData.searchType = 'airport';
            next({ response: airportEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'Please enter your destination');
        }

        search.searchEvents(time, "2017-03-26T09:45:00-04:00", query, function (response) {
            session.dialogData.property = null;
            
             var cards = []; //getCardsAttachments();
            for(var i=0; i<response.length; ++i){
                console.log(response[i]);
                cards.push(
                    new builder.HeroCard(session)
            .title(specialChars.unescape(response[i].title).replace("&#039;", "'"))
            .subtitle("This program starts at: " + response[i].times[0].start)
            .text('This event is run by: ' + response[i].site_name)
            .images([
                builder.CardImage.create(session, 'https://raw.githubusercontent.com/PragashSiva/bart/master/Null-Photo-Image.jpg')
            ])
            .buttons([
                builder.CardAction.openUrl(session, response[i].link , 'Learn More')
            ])


                );
            }

            // create reply with Carousel AttachmentLayout
            var reply = new builder.Message(session)
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(cards);

            session.send(reply);

        })
    }
]);

dialog.matches('Help',[
       // Create the carousel
    function (session, result, next) {
         builder.Prompts.choice("Here's a full list of options.",types)
    }
]);

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
server.post('/api/messages', connector.listen());

