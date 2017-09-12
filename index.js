var TelegramBot = require('node-telegram-bot-api');
const pogobuf = require('pogobuf-vnext');
const POGOProtos = require('node-pogo-protos-vnext');
const nodeGeocoder = require('node-geocoder');
const RequestType = POGOProtos.Networking.Requests.RequestType;
const _ = require('lodash');
var utils = require('./utils');
var Settings = require('./settings');
var Raid = require('./raid');
var Map = require("collections/map");
var raidArr = [];

const settings = new Settings();
const telegramUserID = settings.telegramUserID;
const telegramBotID = settings.telegramBotID;
const ptcUsername = settings.ptcUsername;
const ptcPassword = settings.ptcPassword;
const hashingKey = settings.hashingKey;

telegram = new TelegramBot(telegramBotID, { polling: true });
var latestResult = "";

var coords = {
        latitude: 51.2603015,
        longitude: 4.2176376,
        altitude: _.random(0, 20, true),
};

coords.latitude = settings.lat;
coords.longitude = settings.long;

const client = new pogobuf.Client({
    authType: 'ptc',
    username: ptcUsername,
    password: ptcPassword,
    useHashingServer: true,
    hashingKey: hashingKey,
    version: 7301,
    includeRequestTypeInResponse: true,
});


telegram.on("text", (message) => {
	//Check if user has sent coordinates
    var coordsRegexp = /^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/;
	if (message.text.match(coordsRegexp)) {
		var match = coordsRegexp.exec(message.text);
		updateLocation(match[1],match[3],message);
        raidArr = [];
		return;
	}
	if (message.text === "Alive?"){
		telegram.sendMessage(message.chat.id, latestResult);
		return;
	}
  telegram.sendMessage(message.chat.id, "Hello world");
});

telegram.on("location", (message) => {
    updateLocation(message.location.latitude, message.location.longitude,message);
    raidArr = [];
});

async function updateLocation (latitude,longitude,message){
    coords.latitude = latitude;
    coords.longitude = longitude;
    telegram.sendMessage(message.chat.id, "Location changed to: " + coords.latitude + "," + coords.longitude);
    console.log("Location changed to: " + coords.latitude + "," + coords.longitude);
    await initializeClient();
    await generalScan();
    await doRaidScans();
}

async function initializeClient(){
    // set player position
    client.setPosition(coords);

    // init the app
    await client.init();

    // first empty request like the app
    await client.batchStart().batchCall();

    // get player info
    await client.getPlayer('US', 'en', 'Europe/Paris');

    // get settings, inventory, etc...
    let response = await client.batchStart()
        .downloadRemoteConfigVersion(POGOProtos.Enums.Platform.IOS, '', '', '', 7301)
        .checkChallenge()
        .getHatchedEggs()
        .getInventory()
        .checkAwardedBadges()
        .downloadSettings()
        .batchCall();

    // get data returned by the server that it expect in following calls
    const inventoryResponse = _.find(response, resp => resp._requestType === RequestType.GET_INVENTORY);

    // call getPlayerProfile with data got before
    response = await client.batchStart()
        .getPlayerProfile()
        .checkChallenge()
        .getHatchedEggs()
        .checkAwardedBadges()
        .getBuddyWalked()
        .batchCall();

    // same for levelUpRewards
    response = await client.batchStart()
        .checkChallenge()
        .getHatchedEggs()
        .checkAwardedBadges()
        .getBuddyWalked()
        .getInbox(true, false, 0)
        .batchCall();
}

async function generalScan() {
    // then call a getMapObjects
    const cellIDs = pogobuf.Utils.getCellIDs(coords.latitude, coords.longitude);
    response = await client.batchStart()
        .getMapObjects(cellIDs, Array(cellIDs.length).fill(0))
        .checkChallenge()
        .getHatchedEggs()
        .checkAwardedBadges()
        .getBuddyWalked()
        .getInbox(true, false, 0)
        .batchCall();

    const forts = response[0].map_cells.reduce((all, c) => all.concat(c.forts), []);
    const pokestops = forts.filter(f => f.type === 1);
    let gyms = forts.filter(f => f.type === 0);

    console.log(`Found ${pokestops.length} pokestops.`);
    console.log(`Found ${gyms.length} gyms`);
    var raids;
    if (gyms.length > 0) {
        raids = gyms.filter(g => g.raid_info != null);
        console.log(`  with ${raids.length} raids.`);
    }
    latestResult = `  Found ${raids.length} raids.`
    latestResult += "\n" + new Date();
    for (var i=0; i<raids.length; i++) {
        if (raids.length < 1) {
            continue
        }
        if (raids[i].raid_info.raid_pokemon === null) {
            continue
        }
        var raid_info = raids[i].raid_info;
        var raid_seed = raid_info.raid_seed;
        var gym_id = raids[i].id;
        var raid_latitude = raids[i].latitude;
        var raid_longitude = raids[i].longitude;
        var raid_level = raid_info.raid_level;
        var pokemon_id = raid_info.raid_pokemon.pokemon_id;

        var raid = new Raid(pokemon_id, gym_id, raid_seed, raid_latitude, raid_longitude, raid_info.raid_end_ms, raid_level);
        raidArr.push(raid);

        console.log("\n");
        console.log("Gym ID:" + gym_id);
        console.log("Raid Level:" + raid_level);
        console.log("Lat:" + raid_latitude);
        console.log("Long:" + raid_longitude);
        console.log("Pokemon id:" + utils.idToName(pokemon_id));
        console.log(utils.getTimeString(raid_info.raid_end_ms));
    }
}

async function moveAndScanRaid(latitude, longitude, seed, gymId, pokemonId){
    var raidCoords = {
        latitude: latitude,
        longitude: longitude,
        altitude: _.random(0, 20, true),
    };
    client.setPosition(raidCoords);
    // Do normal scan of the area first
    const cellIDs = pogobuf.Utils.getCellIDs(coords.latitude, coords.longitude);
    response = await client.batchStart()
        .getMapObjects(cellIDs, Array(cellIDs.length).fill(0))
        .checkChallenge()
        .getHatchedEggs()
        .checkAwardedBadges()
        .getBuddyWalked()
        .getInbox(true, false, 0)
        .batchCall();

    //Get info about Raid
    const response2 = await client.getRaidDetails(seed,gymId,[]);
    var numbers_of_players = response2.num_players_in_lobby;

    console.log("Pokemon: " + utils.idToName(pokemonId) +  " Numbers of Players: " + numbers_of_players);
    console.log("\n");

    if (numbers_of_players > 0){
        telegram.sendMessage(telegramUserID, "Active raid: \n" + utils.idToName(pokemonId) + "\n People in loby:" + numbers_of_players +"\nDeeplink: pokego2://" + utils.addRandomDistanceToCoords(latitude) + "," + utils.addRandomDistanceToCoords(longitude)  );
        telegram.sendMessage(telegramUserID, "" + utils.addRandomDistanceToCoords(latitude) + "," + utils.addRandomDistanceToCoords(longitude));
    }

}
async function doRaidScans() {
    //Check if raidtimer is not existing anymore
    raidArr = raidArr.filter(item => item.deSpawn > Date.now())
    for (var i = 0, len = raidArr.length; i < len; i++) {
        var lat = raidArr[i].lat;
        var long = raidArr[i].long;
        var seed = raidArr[i].seed;
        var gymId = raidArr[i].gymId;
        var pokemonId =raidArr[i].pokemonId;
        await moveAndScanRaid(lat,long,seed,gymId,pokemonId);
    }

}
async function Main() {

    await initializeClient();
    await generalScan();
    await doRaidScans();

    // Run the general Area Scan every 5 minutes
    setInterval(generalScan, 300000);

    // Do the Active Raids scan every 20 seconds
    setInterval(doRaidScans, 20000);

    // But mom, I don't want to clean up!
    //client.cleanUp();
}

Main()
    .then(() => console.log('---- Done With first round.'))
    .catch(e => console.error(e));