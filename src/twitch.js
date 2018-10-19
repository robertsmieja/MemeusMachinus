/*
    twitch.js
    Contains Twitch stream alert stuff
	
    Modified by Tyler "NFreak" Morrow for the NFreak Stream Discord.
*/
const fs = require("fs");
let streamerList = JSON.parse(fs.readFileSync("./info/twitch.json", "utf8"));



module.exports.mainGuild = mainGuild;
