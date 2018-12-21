/*
    misc.js
    Contains useful miscellaneous functions used throughout the bot.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.
    Modified by Tyler "NFreak" Morrow for the NFreak Stream Discord.
*/
const fs = require("fs");
const uuid = require("uuid/v4");

const ids = JSON.parse(fs.readFileSync("./info/ids.json", "utf8"));

let reminders = JSON.parse(fs.readFileSync("./info/reminders.json", "utf8"));
let mainGuild = null;

function delay(t) {
	return new Promise(function(resolve) { 
		setTimeout(resolve, t)
	});
}

function addReminder(date, message) {
	let o = {
		date: date,
		message: message,
		id: uuid()
	};

	reminders.push(o);
	fs.writeFileSync("./info/reminders.json", JSON.stringify(reminders, null, "\t"), "utf8");
	console.log("Added reminder: " + message);
}

function removeReminder(id) {
	let indexToRemove = -1;
	for (let i = 0; i < reminders.length; i++) {
		if (reminders[i].id === id) {
			indexToRemove = i;
			break;
		}
	}

	if (indexToRemove > -1) {
		reminders.splice(indexToRemove, 1);
		fs.writeFileSync("./info/reminders.json", JSON.stringify(reminders, null, "\t"), "utf8");
		console.log("Removed reminder.");
	} else {
		console.log("Tried to remove invalid reminder?");
	}
}

function checkReminders() {
	let currentDate = new Date();

	for (let i = 0; i < reminders.length; i++) {
		if (currentDate > new Date(reminders[i].date)) {
			return reminders[i];
		}
	}
	return null;
}

function memberIsMod(message) {
	let ret = false;
	const modNames = ["It me", "Special Dads", "Robot uprising", "Dads"];
	for (let i = 0; i < modNames.length; i++) {
		ret = ret || memberHasRole(message, modNames[i]);		
	}
	return ret;
}

function memberHasRole(message, roleName) {
	let ret = false;
	try {
		ret = roleInRoles(roleName, message.guild.member(message.author).roles.array());
	} catch (e) {
		ret = false;
	}
	
	return ret;
}

function roleInRoles(roleName, roles) {
	for (let i = 0; i < roles.length; i++) {
		if (roles[i].name === roleName)
			return true;
	}
	return false;
}

async function botReply(message, DiscordBot) {
	let a = Math.floor(Math.random() * 10);
	let s = ["wah", "puffWhat", "gunRight", "nfreakW", "stopthis", "expand", "falconPropane", "angery", "doot", "nfreakHi", "spicyoil", "nfreakSoy", "thumbsUp"];
	let selectedName = s[Math.floor(Math.random() * s.length)];
	
	let emote = DiscordBot.emojis.find("name", selectedName);
		
	return await message.channel.send(emote.toString());
}

module.exports.delay = delay;
module.exports.roleInRoles = roleInRoles;
module.exports.memberIsMod = memberIsMod;
module.exports.memberHasRole = memberHasRole;
//module.exports.cacheRoleMessages = cacheRoleMessages;
module.exports.ids = ids;
module.exports.botReply = botReply;
module.exports.reminders = reminders;
module.exports.addReminder = addReminder;
module.exports.removeReminder = removeReminder;
module.exports.checkReminders = checkReminders;
module.exports.mainGuild = mainGuild;
