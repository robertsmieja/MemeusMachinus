/*
    reaction.js
    Handles all things related to reactions and emoji.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.	
    Modified by Tyler "NFreak" Morrow for the NFreak Stream Discord Server.
*/

import fs from "fs";
import Misc from "./misc";
import Discord, {MessageReaction, Snowflake, TextChannel, User} from "discord.js";

let removeReacts = true;
const emojiRoleDict: any = {
    // Nothing yet
};

export default class Reaction {

    public static emojiToRole = (emojiName: string, messageID: Snowflake) => {
        return emojiRoleDict[emojiName];
    };

    public static handleReactionAdd = async (messageReaction: MessageReaction, user: User, DiscordBot: Discord.Client) => {
        let messageChannel = messageReaction.message.channel as TextChannel;
        if (messageChannel.name === "role-assignment") {
            console.log(messageReaction.emoji.name);
            if (messageReaction.emoji.name === "cgccWhite") {
                console.log("Received cgccWhite react");
                //add role emotes
                removeReacts = false;
                let emojiNames = JSON.parse(fs.readFileSync("./info/roleEmoji.json", "utf8"));
                for (let i = 0; i < emojiNames.length; i++) {
                    await messageReaction.message.react(DiscordBot.emojis.find("name", emojiNames[i]));
                }
                await messageReaction.remove(user); //remove the cgccWhite emoji
                removeReacts = true;
            } else {
                console.log("Received something other than cgccWhite");
                let guild = messageReaction.message.member.guild;
                let hasRole = false;
                try {
                    hasRole = Misc.roleInRoles(Reaction.emojiToRole(messageReaction.emoji.name, messageReaction.message.id), guild.member(user).roles.array());
                } catch (e) {
                    ;
                }

                if (!hasRole) {
                    console.log("Add role " + Reaction.emojiToRole(messageReaction.emoji.name, messageReaction.message.id));
                    await guild.member(user).addRole(guild.roles.find("name", Reaction.emojiToRole(messageReaction.emoji.name, messageReaction.message.id)));
                } else {
                    console.log("Remove role " + Reaction.emojiToRole(messageReaction.emoji.name, messageReaction.message.id));
                    await guild.member(user).removeRole(guild.roles.find("name", Reaction.emojiToRole(messageReaction.emoji.name, messageReaction.message.id)));
                }

                if (removeReacts)
                    await messageReaction.remove(user); //as per desired behavior, remove their reaction after they add it
            }
        }
    };

    public static handleReactionRemove = async (messageReaction: MessageReaction, user: User, DiscordBot: Discord.Client) => {
        return null;
    };
}

