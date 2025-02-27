# Setup #
# Envs #
When you just want this project to be an api set the var LOAD_ROUTES to 'api', for cms to 'cms' and for both to 'all'.
Also set the ADMIN_PANEL_ENABLED to '0' when just using the project as an api otherwise set it to '1'

Before you can use the prisma client you need to run npm run prisma:generate - after this the client will be generated and you can connect to the db using the prisma client
## Project ##
Run the following commands to setup your project

```` 
npm install
````
```` 
npm run knex:migrate:latest
````
````
npm run dev
````
Configure your project in the .env file (see .env.example)

## Commands ##
### Typeorm ###
#### Migrations ####
```` 
npm run knex:migrate:make create_app_users_table
````
```` 
npm run knex:migrate:latest
````
#### Seeders ####
```` 
npm run knex:seed:run
````

## Modules & Utils ##
Om het leven van onszelf makkelijk te maken zitten er een aantal Modules en Utils in het framework. Hieronder wordt uitgelegd wat iedere Module/Util inhoudt.

### Modules ###
#### FilesystemsModule ####
Met de FilesystemsModule kun je bestanden uploaden in de storage, in de public folder en in Google Cloud Storage. Je kan ook bestanden lezen uit de storage en je kan de mimetype ophalen van een bestand.
#### ImageModule ####
Met de ImageModule kun je afbeeldingen manipuleren en informatie verkrijgen van een afbeelding. Je kan onder andere een afbeeldingen resizen of converteren naar een png of jpg.
#### MailModule ####
Met de MailModule kun je mails met bijlagen verzenden.
### Utils ###
#### ApiResponses ####
De util ApiResponses heeft 2 methodes response(response, data, status) en errorResponse(res, code, extraData, status). De eerste methode geeft een normale response terug met eventuele data. De tweede methode geeft een errorResponse terug, als de code (error code) bestaat in de errors config (config/errorcodes.ts), dan wordt er een automatische response aangemaakt. Er kan ook nog extra data worden toegevoegd aan de errorResponse.
#### Axios ####
Met de util Axios kun je makkelijk normale, basic authentication of bearer token Api calls maken.
#### Crypt ####
Met de util Crypt kun je data encrypten, decrypten of hashen.
#### Logger ####
Met de util Logger kun je loggen. De Logger heeft  5 functies: error, warn, info, http en debug.

## Packages ##
Hieronder staan alle packages die worden gebruikt in het framework.
### Configuratie ###
* express: Dit is het framework
* dotenv: Met deze package kun je de .env variabelen ophalen.
* mysql: Deze package heb je nodig voor de database connectie.
* prisma: Deze package heb je nodig zodat je een ORM kan gebruiken, dit bespaart veel tijd op zelf query’s schrijven.
* Cors: Deze package heb je nodig zodat je je cors kan instellen.
* Compression: Deze package heb je nodig zodat je data die gedownload kan worden door de gebruikers een stuk kleiner is. Dit zal de performance verbeteren van je applicatie.
* Helmet: Deze package heb je nodig zodat de HTTP headers  die worden gereturned door je Express applicatie beveiligd zijn.
* express-fileupload: Deze package heb je nodig om de file upload mee af te handelen.
* express-rate-limit: Deze package heb je nodig om voor sommige routes een rate limit op te stellen. Zodat een gebruiker niet een onbeperkt aantal requests naar een route kan sturen.
* express-async-errors: Deze package heb je nodig om errors mee af te handelen.
* nodemon: Deze package heb je nodig voor de runtime environment
* ts-node: Deze package heb je nodig voor de runtime environment
* tslint: Deze package heb je nodig voor code convention checks
* shelljs: Deze package heb je nodig om de view templates te kopiëren naar de dist folder bij het builden van je applicatie
* typescript: Deze package heb je nodig voor de structuur van je applicatie.
* viewengine naar keuze: EJS, Handlebars, Pug.

### Helpers ###
* axios: Deze package heb je nodig om externe api calls mee te doen.
* google-cloud/storage: Deze package heb je nodig om bestanden te uploaden in de Google Cloud Storage.
* express-validator: Deze package heb je nodig om je request te valideren.
* nodemailer: Deze package heb je nodig om mails mee te versturen.
* winston: Deze package heb je nodig om te kunnen loggen.
* lodash: Deze package heb je nodig voor standaard functies wat voor functies (utility library):
    * Array
    * Collection
    * Object
    * Sequences
    * Math
    * Is……… methods
    * Number
    * String
* Luxon: Deze package heb je nodig om met tijd om te gaan.
* passport: Deze package heb je nodig om OAuth te implementeren in je applicatie.
* Jsonwebtoken: Deze package heb je nodig om de access_token te genereren en te valideren.
* Crypto: Deze package heb je nodig om te kunnen encrypten, decrypten en hashen.
* bcrypt: Deze package heb je nodig om te kunnen hashen.
* json2csv: Deze package heb je nodig om een csv bestand te kunnen genereren.
* Xlsx: Deze package heb je nodig om een excel bestand te kunnen genereren.
* basic-auth: Deze package heb je nodig voor basic authentication.
* sharp: Deze package heb je nodig om een afbeelding te kunnen manipuleren.
* redis: Deze package heb je nodig om redis te gebruiken.
* pluralize: Deze package heb je nodig om meervoud van een woord te genereren bij het maken van een model.
