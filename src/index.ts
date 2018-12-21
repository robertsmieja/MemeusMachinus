/*
	MemeusMachinus index.js
	
	Originally written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server. 
	Modified by Tyler "NFreak" Morrow for the NFreak Stream Discord.
*/

//Node imports
import fs from 'fs';
import Discord, {Message, MessageReaction, TextChannel, User} from 'discord.js';

//Run configuration
import configure from "./config";
configure();

//Local imports
import Misc from './misc';
import Blacklist from './blacklist';
import Commands from './commands';
import Reaction from './reaction';

//Read in Token
const discordToken = fs.readFileSync('./info/discordToken.txt', 'utf8').replace("\n", "");

//Instance Data
const utcHourToCheck = 23; //11pm EST
let lastMessageDate = new Date();
const updateCacheEvery = 500;
let numMessages = 0;
export let mainGuild : any = null;

//Intro text
let intros = JSON.parse(fs.readFileSync("./info/intros.json", "utf8"));

//Spambot detection
let spambots = JSON.parse(fs.readFileSync("./info/spam.json", "utf8"));


//Create DiscordBot
const DiscordBot = new Discord.Client({ 
	//autofetch: ['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'],
	messageCacheMaxSize: updateCacheEvery + 50
});



//Executed upon a message being sent to any channel the bot can look at
DiscordBot.on('message', async (message: Message) => {
	if (message.author.bot) return;
	
	let args = message.content.toLowerCase().split(" ");

	//Mod specific handlers:
	if (Misc.memberIsMod(message)) {
		await Commands.modCommands(message, args);
		await Blacklist.handleBlacklistCommands(message, args);

		//if (args[0] == "=refresh") //needs to use the DiscordBot object directly, so it's in index
		//	await misc.cacheRoleMessages(DiscordBot);
	}

	// Check all messages for userCommands
	await Commands.userCommands(message, args);

	// If someone asks MemeusMachinus a question
	if (message.isMemberMentioned(DiscordBot.user) && message.content[message.content.length - 1] == "?") {
		await Misc.botReply(message, DiscordBot);
	}
	
	//Handle all blacklist removal/warning
	let censored = await Blacklist.handleBlacklist(message, DiscordBot.user.tag);
	if (!censored) {
		await Blacklist.handleBlacklistPotential(message, DiscordBot.user.tag);
	}

	//Every `updateCacheEvery` messages, update the cache to hopefully ensure the reaction messages are never bumped out of cache
	//if (++numMessages >= updateCacheEvery) {
	//	numMessages = 0;
	//	await misc.cacheRoleMessages(DiscordBot);
	//}

	let reminderToSend = Misc.checkReminders();
	if (reminderToSend) {
		let reminderChannel = mainGuild.channels.get(Misc.ids.reminders);
		await reminderChannel.send(reminderToSend.message);
		Misc.removeReminder(reminderToSend.id);
	}
});

//Executed upon a reaction being added to a message in the cache
DiscordBot.on("messageReactionAdd", async (messageReaction: MessageReaction, user: User) => {
	await Reaction.handleReactionAdd(messageReaction, user, DiscordBot);
});

//Executed upon a reaction being removed from a message in the cache
DiscordBot.on("messageReactionRemove", async (messageReaction: MessageReaction, user : User) => {
	await Reaction.handleReactionRemove(messageReaction, user, DiscordBot);
});

DiscordBot.on("voiceStateUpdate", async(oldMember, newMember) => {
	// await Misc.manageVoiceChannels(newMember.guild);
});

//Executed upon a new user joining the server
DiscordBot.on('guildMemberAdd', async(member) => {
	let introductionsChannel = DiscordBot.channels.get(Misc.ids.introductions) as TextChannel;
	var rulesAndRoles = " You'll be granted a Member role very soon. Be sure to read through "+ DiscordBot.channels.get(Misc.ids.rules) + "!";
	var ran = Math.floor(Math.random() * intros.length);
	
	//Handle spambots and send intro messages
	var spam = false;
	for (let i = 0; i < spambots.length && !spam; i++){
		if (member.displayName.toLowerCase().includes(spambots[i])){
			console.log("Kicking a spambot: " + member.displayName);
			member.send("Spambots are not welcome in this server. If you believe this was in error, remove the URL or spam phrase from your username before rejoining.");
			spam = true;
			await member.kick("Spambot eliminated");
		}
	}
	if (!spam){
		setTimeout(() => {
			member.addRole(member.guild.roles.find("name", "Bunch of nerds"));
		}, 120000) // 2 minutes
		await introductionsChannel!.send(intros[ran] + "<@!" + member.id + ">" + "!" + rulesAndRoles);
	}
});


//Log into Discord using /info/DiscordToken.txt
console.log("Time to log in.");
DiscordBot.login(discordToken).catch(function (reason) {
	console.log(reason);
});

//Executed upon successful login
DiscordBot.on('ready', async () => {
	mainGuild = DiscordBot.guilds.get(Misc.ids.server);
	Misc.mainGuild = mainGuild;
	console.log('MemeusMachinus is ready');
	DiscordBot.setMaxListeners(0); //done to ensure it responds to everything regardless of how busy the server gets
	await DiscordBot.user.setActivity("Type !help for commands!");
	//await misc.cacheRoleMessages(DiscordBot);
});

