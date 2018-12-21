/*
    misc.js
    Contains useful miscellaneous functions used throughout the bot.

    Written by Adam "WaveParadigm" Gincel for the Icons: Combat Arena Discord Server.
    Modified by Tyler "NFreak" Morrow for the NFreak Stream Discord.
*/
import uuid from 'uuid/v4';
import {v4 as UUIDv4} from "uuid/interfaces";

import fs from "fs";
import Discord, {Message, Role} from "discord.js";

export default class Misc {
    static readonly ids = JSON.parse(fs.readFileSync("./info/ids.json", "utf8"));

    public static reminders = JSON.parse(fs.readFileSync("./info/reminders.json", "utf8"));
    public static mainGuild = null;

    public static delay = (t: number) => {
        return new Promise(function (resolve) {
            setTimeout(resolve, t)
        });
    };

    public static addReminder = (date: Date, message: string) => {
        let o = {
            date: date,
            message: message,
            id: uuid()
        };

        Misc.reminders.push(o);
        fs.writeFileSync("./info/reminders.json", JSON.stringify(Misc.reminders, null, "\t"), "utf8");
        console.log("Added reminder: " + message);
    };

    public static removeReminder = (id: UUIDv4) => {
        let indexToRemove = -1;
        for (let i = 0; i < Misc.reminders.length; i++) {
            if (Misc.reminders[i].id === id) {
                indexToRemove = i;
                break;
            }
        }

        if (indexToRemove > -1) {
            Misc.reminders.splice(indexToRemove, 1);
            fs.writeFileSync("./info/reminders.json", JSON.stringify(Misc.reminders, null, "\t"), "utf8");
            console.log("Removed reminder.");
        } else {
            console.log("Tried to remove invalid reminder?");
        }
    };

    public static checkReminders = () => {
        let currentDate = new Date();

        for (let i = 0; i < Misc.reminders.length; i++) {
            if (currentDate > new Date(Misc.reminders[i].date)) {
                return Misc.reminders[i];
            }
        }
        return null;
    };

    public static memberIsMod = (message: Message) => {
        let ret = false;
        const modNames = ["It me", "Special Dads", "Robot uprising", "Dads"];
        for (let i = 0; i < modNames.length; i++) {
            ret = ret || Misc.memberHasRole(message, modNames[i]);
        }
        return ret;
    };

    public static memberHasRole = (message: Message, roleName: string) => {
        let ret = false;
        try {
            ret = Misc.roleInRoles(roleName, message.guild.member(message.author).roles.array());
        } catch (e) {
            ret = false;
        }

        return ret;
    };

    public static roleInRoles = (roleName: string, roles: Role[]) => {
        for (let i = 0; i < roles.length; i++) {
            if (roles[i].name === roleName)
                return true;
        }
        return false;
    };

    public static botReply = async (message: Message, DiscordBot: Discord.Client) => {
        let a = Math.floor(Math.random() * 10);
        let s = ["wah", "puffWhat", "gunRight", "nfreakW", "stopthis", "expand", "falconPropane", "angery", "doot", "nfreakHi", "spicyoil", "nfreakSoy", "thumbsUp"];
        let selectedName = s[Math.floor(Math.random() * s.length)];

        let emote = DiscordBot.emojis.find("name", selectedName);

        return await message.channel.send(emote.toString());
    };

}