/*
    commands.js
    Handles comands, performing assorted responses to input.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.
    Modified by Tyler "NFreak" Morrow for the NFreak Stream Discord.
*/

import fs from "fs";
import {Collection, Message, TextChannel} from "discord.js";
import Misc from "./misc";

export default class Commands {

    public static todoList = JSON.parse(fs.readFileSync("./info/todo.json", "utf8"));
    public static userCommandList = JSON.parse(fs.readFileSync("./info/userCommands.json", "utf8"));
    public static streamerList = JSON.parse(fs.readFileSync("./info/twitch.json", "utf8"));

//Spambot detection
    public static spamlist = JSON.parse(fs.readFileSync("./info/spam.json", "utf8"));

    public static commandPrefix = "!";
    public static helpString: string[] = [
        "`!members` - Tell us how many members are on a server, and how many are online.\n" +
        "`!top PLACEMENTS NUM_MESSAGES CHANNEL_NAME` - Tells you the top `PLACEMENTS` most frequent posters over the last `NUM_MESSAGES` messages in #`CHANNEL_NAME` (more messages = more time)\n" +
        "`!setcommand COMMAND_NAME text` - Will create a user-accessible =`COMMAND_NAME` that will make the bot return any text after `COMMAND_NAME`.\n" +
        "`!describecommand COMMAND_NAME description` - Adds a description to display in `!help` for the users.\n" +
        "`!removecommand COMMAND_NAME` - Will remove the user-accessible =`COMMAND_NAME`, if it exists.\n" +
        "`!hidecommand COMMAND_NAME` - Toggles visibility of a help command.\n" +
        "`!helpcount` - Show number of uses each user command has recieved.\n" +
        "`!helphidden` - Display hidden user commands.\n" +
        "`!kill` - End this bot instance. Bot should automatically restart.\n" +
        "`!refresh` - Remove all reacts not by the bot in the roles channel.\n" +
        "`!say CHANNEL MESSAGE` - Send any message to any channel.\n" +
        "`!purge CHANNEL NUMBER` - Delete NUMBER messages from CHANNEL.\n" +
        "`!remindme DAYS MESSAGE` - Send an automatic message to the bot-spam channel after `DAYS` days have passed.\n"
        ,

        "`!emotelist EMOTES` - The list of emotes to add to a message when reacting with :cgccWhite:.\n" +
        "`!todo` - Display the todo list.\n" +
        "`!todo add task` - Adds `task` to the todo list.\n" +
        "`!todo remove task` - Removes `task` from the todo list. Either by string or number.\n" +
        "`!blacklist` - List all words currently on the blacklist.\n" +
        "`!blacklist add word` - Add `word` to the blacklist.\n" +
        "`!blacklist remove word` - Remove `word` from the blacklist.\n" +
        "`!blacklist violations ID|Tag` - List all words that were removed as violations from a user with that ID or Tag.\n" +
        "`!blacklist warnings ID|Tag` - List all words that were flagged as warnings from a user with that ID or Tag.\n" +
        "`!log` - Print a log of all users with recorded blacklist warnings or infractions.\n" +
        "`!logfile` - Send a .csv file containing users and the quantity of violations/warnings.\n" +
        "`!spambots add word' - Add a string to the new user spambot filter\n" +
        "`!spambots remove word' - Remove a string from the spambot filter\n"
    ];


    public static modCommands = async (message: Message, args: string[]): Promise<any> => {
        if (args[0] === "!members") {
            let memberList = message.guild.members.array();
            let memberCount = message.guild.memberCount;
            let onlineCount = 0;
            for (let i = 0; i < memberList.length; i++) {
                if (memberList[i].presence.status !== "offline")
                    onlineCount += 1;
            }
            return await message.channel.send(message.guild.name + " currently has " + memberCount + " total members. " + onlineCount + " members are currently online.");
        } else if (args[0] === "!todo") {
            if (args.length === 1) {
                let str = "Todo list:\n\n";
                for (let i = 0; i < Commands.todoList.length; i++)
                    str += i.toString() + ": " + Commands.todoList[i] + "\n";
                return await message.channel.send(str);
            } else if (args.length === 2) {
                if (args[1] === "add")
                    return await message.channel.send("Usage: `!todo add item`");
                else if (args[1] === "remove")
                    return await message.channel.send("Usage: `!todo remove item`");
            } else if (args.length > 2) {
                let task = message.content.substring(("!todo " + args[1] + " ").length);
                if (args[1] === "add") {
                    Commands.todoList.push(task);
                    fs.writeFileSync('./info/todo.json', JSON.stringify(Commands.todoList, null, "\t"));
                    return await message.channel.send("Added `" + task + "` to the todo list.");
                } else if (args[1] === "remove") {
                    if (Number(task) === NaN) {
                        let ind = Commands.todoList.indexOf(task);
                        if (ind < 0) {
                            return await message.channel.send("Could not find `" + task + "` on the todo list.");
                        } else {
                            Commands.todoList.splice(ind, 1);
                            fs.writeFileSync('./info/todo.json', JSON.stringify(Commands.todoList, null, "\t"));
                            return await message.channel.send("Removed `" + task + "` from the todo list.");
                        }
                    } else {
                        let ind = parseInt(task);
                        if (ind < Commands.todoList.length) {
                            task = Commands.todoList[ind];
                            Commands.todoList.splice(ind, 1);
                            fs.writeFileSync('./info/todo.json', JSON.stringify(Commands.todoList, null, "\t"));
                            return await message.channel.send("Removed `" + task + "` from the todo list.");
                        } else {
                            return await message.channel.send("Index " + args[2] + " is not a valid number on the todo list.");
                        }
                    }
                }
            }
        } else if (args[0] === "!top") {
            if (args.length < 4) {
                return await message.channel.send("USAGE: `!top PLACEMENTS QUANTITY_MESSAGES CHANNEL_NAME` -- For Example `!top 5 10000 general` would return the Top 5 posters over the last 10000 messages in #general.");
            }
            let quantity_messages = 0;
            let relevant_channel;
            let placements = 0;
            try {
                placements = parseInt(args[1]);
                quantity_messages = ((parseFloat(args[2]) / 100) as number);
                if (quantity_messages < 1)
                    quantity_messages = 1;
                if (args[3].startsWith("#")) {
                    args[3] = args[3].substring(1);
                }
                relevant_channel = message.guild.channels.find("name", args[3]) as TextChannel;
                console.log(relevant_channel);
            } catch (e) {
                return await message.channel.send(e.message);
            }
            let resultsMessage = await message.channel.send("*Calculating...*") as Message;
            let msgArray: Message[] = [];
            let before = "";
            for (let i = 0; i < quantity_messages; i++) {

                interface Options {
                    limit: number,
                    before?: string
                }

                let options: Options = {limit: 100, before};
                if (before !== "")
                    options.before = before;

                let msgs: Collection<string, Message> = await relevant_channel.fetchMessages(options);
                let msgTemp = msgs.array();
                msgArray = msgArray.concat(msgTemp);
                before = msgTemp[msgTemp.length - 1].id;
            }

            let dict: any = {};
            for (let i = 0; i < msgArray.length; i++) {
                if (msgArray[i].author.id in dict) {
                    dict[msgArray[i].author.id][0] += 1;
                } else {
                    dict[msgArray[i].author.id] = [];
                    dict[msgArray[i].author.id][0] = 1;
                    dict[msgArray[i].author.id][1] = msgArray[i].author.tag;
                }
            }
            let dictArray = [];
            for (let user in dict) {
                dictArray.push([user, dict[user][0], dict[user][1]]);
            }
            dictArray.sort(function (a, b) {
                return b[1] - a[1];
            });
            let str = "Top " + placements + " #" + args[3] + " posters as of the last " + args[2] + " messages, since `" + msgArray[msgArray.length - 1].createdAt + "`:\n\n";
            for (let i = 0; i < placements && i < dictArray.length; i++) {
                str += dictArray[i][2] + ": " + dictArray[i][1] + "\n";
            }
            console.log(str);
            return await resultsMessage.edit(str);
        } else if (args[0] === "!purge") {
            if (args.length < 3)
                return await message.channel.send("USAGE: `!purge CHANNEL QUANTITY` -- example: `!purge general 100` will delete the last 100 messages in #general.");

            let relevant_channel = null;
            let quantity_messages = 0;
            try {
                if (args[1].startsWith("#"))
                    args[1] = args[1].substring(1);
                quantity_messages = parseInt(args[2]);
                relevant_channel = message.guild.channels.find("name", args[1]) as TextChannel;
            } catch (e) {
                return await message.channel.send(e.message);
            }
            if (relevant_channel == null) {
                return await message.channel.send("Could not find a channel with that name.");
            }
            let mChannel = message.channel;
            await message.delete();
            let msgArray = [];
            let before = "";
            for (let i = 0; i < quantity_messages; i++) {
                let options = {limit: 1};

                let msgs = await relevant_channel.fetchMessages(options);
                let msgsTemp = msgs.array();
                for (let j = 0; j < msgsTemp.length; j++) {
                    await msgsTemp[j].delete();
                }
            }
            return await mChannel.send(quantity_messages.toString() + " messages deleted from " + args[1] + ".");
        } else if (args[0] === "!modhelp") {
            let s = "Here are some commands I can do for Moderators:\n\n";
            if (args.length === 1)
                s += Commands.helpString[0];
            else
                s += Commands.helpString[parseInt(args[1])];
            s += "`!help` - Commands for all users.\n";
            s += "Try `!modhelp 0` or `!modhelp 1` for more commands.";
            await message.channel.send(s);
        } else if (args[0] === "!logfile") {
            await message.channel.send({
                files: [{
                    attachment: "./info/censorshipInfo.csv",
                    name: "CgccLog.csv"
                }]
            });
        } else if (args[0] === "!kill") {
            console.log("Received !kill.");
            process.exit(1);
        } else if (args[0] === "!say") {

            if (args.length < 3) {
                return await message.channel.send("USAGE: `!say CHANNEL MESSAGE` -- example: `!say general Hello world!`");
            }
            let len = args[0].length + args[1].length + 2;
            if (args[1].startsWith("#")) {
                args[1] = args[1].substring(1);
            }
            let relevant_channel = null;
            try {
                relevant_channel = message.guild.channels.find("name", args[1]) as TextChannel;
            } catch (e) {
                return await message.channel.send(e.message);
            }
            if (relevant_channel == null) {
                return await message.channel.send("I couldn't find a channel with that name.");
            }

            return await relevant_channel.send(message.content.substring(len));

        } else if (args[0] === "!remindme") {
            if (args.length < 3) {
                return await message.channel.send("USAGE EXAMPLE: `!remindme 3 unban ThatGuy#0001` - 72 hours (3 days) after posting this, I will send the message `unban ThatGuy#0001`.");
            }
            let time = parseFloat(args[1]);
            if (time) {
                let msg = message.content.substring(args[0].length + args[1].length + 2);
                let currentDate = new Date();
                Misc.addReminder(new Date(currentDate.getTime() + (1000 * 60 * 60 * 24) * time), msg);
                return await message.channel.send("Added reminder in " + args[1] + " days to: " + msg);
            } else {
                return await message.channel.send("Invalid number of days provided.");
            }
        } else if (args[0] === "!emotelist") {
            if (args.length > 1) {
                let arr: any[] = [];
                if (args[1] !== "none") {
                    let argsNorm = message.content.split(" ");
                    for (let i = 1; i < argsNorm.length; i++) {
                        arr.push(argsNorm[i]);
                    }
                }

                fs.writeFileSync("./info/roleEmoji.json", JSON.stringify(arr), "utf8");

                return await message.channel.send(`Set emotelist to: ${arr.length === 0 ? "Empty." : arr.toString()}`);
            } else {
                return await message.channel.send("Example usage: `!emotelist zhuW zhuW2 puffWhat`.");
            }
        } else if (args[0] === "!setcommand") {
            if (args.length < 3) {
                return await message.channel.send("USAGE: `!setcommand COMMAND_NAME text` -- For example the command `!setcommand controllers Here's some useful controller info!` would create a command `!controllers` that would print `Here's some useful controller info!`.");
            } else {
                //first check if such a command already exists
                let exists = false;
                for (let i = 0; i < Commands.userCommandList.length; i++) {
                    if (Commands.userCommandList[i].command == Commands.commandPrefix + args[1]) {
                        //just update its text
                        Commands.userCommandList[i].text = message.content.substring(args[0].length + args[1].length + 2);
                        exists = true;
                    }
                }

                if (!exists) { //add new command
                    let toAdd = {
                        "command": Commands.commandPrefix + args[1],
                        "text": message.content.substring(args[0].length + args[1].length + 2),
                        "description": ""
                    };
                    Commands.userCommandList.push(toAdd);
                }

                fs.writeFileSync("./info/userCommands.json", JSON.stringify(Commands.userCommandList, null, "\t"), "utf8");
                let s = exists ? "Modified " : "Created ";
                return await message.channel.send(s + "the `" + Commands.commandPrefix + args[1] + "` command.");
            }
        } else if (args[0] === "!removecommand") {
            if (args.length < 2) {
                return await message.channel.send("USAGE: `!removecommand COMMAND_NAME` - For example `!removecommand controllers` would remove the `!controllers` command.");
            }

            for (let i = 0; i < Commands.userCommandList.length; i++) {
                if (Commands.userCommandList[i].command === Commands.commandPrefix + args[1]) {
                    Commands.userCommandList.splice(i, 1);
                }
            }

            fs.writeFileSync("./info/userCommands.json", JSON.stringify(Commands.userCommandList, null, "\t"), "utf8");
            return await message.channel.send("Removed `" + Commands.commandPrefix + args[1] + "`.");
        } else if (args[0] === "!describecommand") {
            if (args.length < 3) {
                return await message.channel.send("USAGE: `!describecommand COMMAND_NAME description` - For example `!describecommand controllers Controller support info.` would set the description of `!controllers` to `Controller support info.`");
            }

            //first find the relevant element index
            let index = -1;
            for (let i = 0; i < Commands.userCommandList.length; i++) {
                if (Commands.userCommandList[i].command === Commands.commandPrefix + args[1]) {
                    index = i;
                }
            }

            if (index > -1) {
                Commands.userCommandList[index].description = message.content.substring(args[0].length + args[1].length + 2);
                fs.writeFileSync("./info/userCommands.json", JSON.stringify(Commands.userCommandList, null, "\t"), "utf8");

                return await message.channel.send("Updated description of `" + Commands.commandPrefix + args[1] + "`.");
            } else {
                return await message.channel.send("Could not find `" + Commands.commandPrefix + args[1] + "`.");
            }
        } else if (args[0] === "!hidecommand") {
            if (args.length < 2)
                return await message.channel.send("USAGE: `!hidecommand COMMANDNAME` ie to hide the `!ping` command type `!hidecommand ping`.");
            if (args[1][0] === Commands.commandPrefix) //remove user-typed prefix if it exists
                args[1] = args[1].substring(1);
            let index = -1;
            for (let i = 0; i < Commands.userCommandList.length; i++) {
                if (Commands.userCommandList[i].command === Commands.commandPrefix + args[1])
                    index = i;
            }
            if (index !== -1) {
                if (!Commands.userCommandList[index].hide)
                    Commands.userCommandList[index].hide = true;
                else
                    Commands.userCommandList[index].hide = false;
                fs.writeFileSync("./info/userCommands.json", JSON.stringify(Commands.userCommandList, null, "\t"), "utf8");
                return await message.channel.send("Set `" + Commands.commandPrefix + args[1] + "` to " + (Commands.userCommandList[index].hide ? "hidden" : "visible") + ".");
            } else {
                return await message.channel.send("Could not find the command `" + Commands.commandPrefix + args[1] + "`.");
            }
        } else if (args[0] === "!helpcount") {
            let s = "Command usage stats:\n";
            for (let i = 0; i < Commands.userCommandList.length; i++) {
                s += "`" + Commands.userCommandList[i].command + "`: " + (Commands.userCommandList[i].count ? Commands.userCommandList[i].count.toString() : "0") + "\n";
            }
            return await message.channel.send(s);
        } else if (args[0] === "!helphidden") {
            let s = "Hidden help commands:\n";
            for (let i = 0; i < Commands.userCommandList.length; i++) {
                if (Commands.userCommandList[i].hide) {
                    s += "`" + Commands.userCommandList[i].command + "`\n";
                }
            }
            return await message.channel.send(s);
        } else if (args[0] === "!addstreamer") {
            if (args.length < 3) {
                return await message.channel.send("USAGE: `!addstreamer USER CHANNEL");
            } else {
                let exists = false;
                for (let i = 0; i < Commands.streamerList.length; i++) {
                    if (Commands.streamerList[i].userID === args[1]) {
                        Commands.streamerList[i].channel = args[2];
                        exists = true;
                    }
                }
                if (!exists) { //add new
                    let toAdd = {
                        "userID": args[1],
                        "channel": args[2]
                    };
                    Commands.streamerList.push(toAdd);
                }

                fs.writeFileSync("./info/twitch.json", JSON.stringify(Commands.streamerList, null, "\t"), "utf8");
                let s = exists ? "Updated " : "Added ";
                let s2 = exists ? "on " : "to ";
                return await message.channel.send(s + args[1] + s2 + "stream alerts! Check them out at twitch.tv/" + args[2]);
            }
        } else if (args[0] === "!spambots") {
            if (args.length === 1) {
                let str = "Words on the spambot filter: \n`";
                for (let i = 0; i < Commands.spamlist.length; i++) {
                    str += Commands.spamlist[i] + "\n";
                }
                str += "`";
                return await message.channel.send(str);
            } else if (args.length > 1 && args[1] === "add") {
                if (args.length > 2) {
                    Commands.spamlist.push(args[2]);
                    fs.writeFileSync('./info/spam.json', JSON.stringify(Commands.spamlist), 'utf8');
                    await message.channel.send("`" + args[2] + "` has been added to the spamlist.");
                } else {
                    await message.channel.send("Usage: `!spamlist add word`");
                }
            } else if (args.length > 1 && args[1] === "remove") {
                if (args.length > 2) {
                    let ind = Commands.spamlist.indexOf(args[2]);
                    if (ind > -1) {
                        Commands.spamlist.splice(ind, 1);
                        fs.writeFileSync('./info/spam.json', JSON.stringify(Commands.spamlist), 'utf8');
                        await message.channel.send("`" + args[2] + "` has been removed from the spamlist.");
                    } else {
                        await message.channel.send("`" + args[2] + "` was not found in the spamlist.");
                    }
                } else {
                    await message.channel.send("Usage: `!spamlist remove word`");
                }
            }
        }
    };

    public static userCommands = async (message: Message, args: string[]): Promise<any> => {
        let userHelpString = "";
        if (args[0] === "!help") {
            for (let i = 0; i < Commands.userCommandList.length; i++) {
                if (!Commands.userCommandList[i].hide) {
                    userHelpString += "`" + Commands.userCommandList[i].command + "` -  " + Commands.userCommandList[i].description + "\n";
                }
            }
            return await message.channel.send("Here's a list of commands for all users:\n" + userHelpString);
        } else if (args[0] === "!meme") {
            var ran = Math.floor(Math.random() * 242);
            try {
                return await message.channel.send({
                    files: [{
                        attachment: "./img/meme/meme" + ran + ".png",
                        name: "meme" + ran + ".png"
                    }]
                });
            } catch (e) {
                return await message.channel.send("ice cream machine broke");
            }
        } else if (args[0].startsWith(Commands.commandPrefix)) {
            for (let i = 0; i < Commands.userCommandList.length; i++) {
                //check through all defined userCommands
                if (args[0] === Commands.userCommandList[i].command) {
                    if (!Commands.userCommandList[i].count)
                        Commands.userCommandList[i].count = 0;
                    Commands.userCommandList[i].count += 1;
                    fs.writeFileSync("./info/userCommands.json", JSON.stringify(Commands.userCommandList, null, "\t"), "utf8");
                    return await message.channel.send(Commands.userCommandList[i].text);
                }
            }
        }
    };
}