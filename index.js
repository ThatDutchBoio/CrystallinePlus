const discord = require('discord.js');
const config = require('./config.json')
const bot = new discord.Client()
const prefix = config.prefix;
const fs = require('fs');
const db = require('better-sqlite3')
const sql = new db('./data.sqlite');
const Canvas = require('canvas')


const {
    ifError
} = require('assert');
bot.on('ready', () => {
    console.log("Bot online");
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
        sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT,points INTEGER,level INTEGER,warns TEXT);").run();
        sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
        sql.pragma("synchronous = 1");
        sql.pragma("journal_mode = wal");

    }
    bot.getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
    bot.setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level, warns) VALUES (@id, @user, @guild, @points, @level, @warns);");
})

function getscore(userId, guildId) {
    let score = bot.getScore.get(userId, guildId);
    if (!score) {
        let warnsString = JSON.stringify([]);
        score = {
            id: `${guildId}-${userId}`,
            user: userId,
            guild:guildId,
            points: 0,
            level: 1,
            warns: warnsString
        }
        bot.setScore.run(score);
    }
    return bot.getScore.get(userId, guildId);
}
// const muteMsg = new discord.MessageEmbed()
//        .setTitle(":white_check_mark: Muting "+user.user.tag+" for "+length+" Seconds")
//       .setColor("GREEN")
//        .setAuthor(bot.user.tag,bot.user.avatarURL({dynamic: false, format: 'png', size: 512}))
// templat: member.guild.id+"_"+member.id

const applyText = (canvas, text) => {
    const ctx = canvas.getContext('2d');

    // Declare a base size of the font
    let fontSize = 70;

    do {
        // Assign the font to the context and decrement it so it can be measured again
        ctx.font = `${fontSize -= 10}px sans-serif`;
        // Compare pixel width of the text to the canvas minus the approximate avatar size
    } while (ctx.measureText(text).width > canvas.width - 300);

    // Return the result to use in the actual canvas
    return ctx.font;
};
bot.on('guildMemberAdd', async member => {
    const welcome = new discord.MessageEmbed()
        .setTitle("Welcome to the server!")
        .setDescription("We hope you have a nice stay and hope to see ya chatting soon! \n if you need help with anything at all be sure to go to the request-support channel and type ;support! a staff members will be with you shortly")
        .setAuthor(bot.user.tag, bot.user.avatarURL({
            dynamic: false,
            format: 'png',
            size: 512
        }))
        .setColor("RED")

    member.createDM({
        embed: welcome
    })
    
    let role = member.guild.roles.cache.find(r => r.name === "Member");
    member.roles.add(role);
    let citrine = member.guild.roles.cache.find(r => r.name === "Lvl 1 | Citrine")
    const channel = member.guild.channels.cache.find(ch => ch.name === 'member-logs');
	if (!channel) return console.log('error');

	const canvas = Canvas.createCanvas(700, 250);
	const ctx = canvas.getContext('2d');


	const background = await Canvas.loadImage('./wallpaper.png');
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle ='#74037b';
    ctx.strokeRect(0,0,canvas.width,canvas.height);

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Welcome to the server,',canvas.width/2.5,canvas.height/3.5)

    ctx.font = applyText(canvas,member.displayName);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${member.displayName}!`,canvas.width /2.5,canvas.height/1.8);

    ctx.beginPath();
    ctx.arc(125,125,100,0,Math.PI * 2,true);
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(member.user.displayAvatarURL({format: "jpg"}));

    ctx.drawImage(avatar,25,25,200,200);

    const attachment = new discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
	channel.send(`Welcome to the server, ${member}!`, attachment);

    

})
let oldRoles = new Map();
bot.on('message', async msg => {
    if (msg.author.id != bot.user.id) {
        let score = getscore(msg.author.id, msg.guild.id);
        if (!score) {
            let warnsString = JSON.stringify([]);
            score = {
                id: `${msg.guild.id}-${msg.author.id}`,
                user: msg.author.id,
                guild: msg.guild.id,
                points: 0,
                level: 1,
                warns: warnsString
            }
            bot.setScore.run(score);
        }
        console.log(score)
        score.points = score.points + 1;
        if(score.level >= 1){
            let citrine = msg.guild.roles.cache.find(r => r.name == "Lvl 1 | Citrine");
            msg.member.roles.add(citrine);
        }else if(score.level >= 5){
            let sodalite = msg.guild.roles.cache.find(r => r.name == "Lvl 5 | Sodalite");
            msg.member.roles.add(sodalite);
        }else if(score.level >= 10){
            let rosequartz = msg.guild.roles.cache.find(r => r.name == 'Lvl 10 | Rose quartz');
            msg.member.roles.add(rosequartz);
        }else if(score.level >= 20){
            let sapphire = msg.guild.roles.cache.find(r => r.name == 'Lvl 20 | Sapphire');
            msg.member.roles.add(sapphire);
        }else if(score.level >= 30){
            let emerald = msg.guild.roles.cache.find(r => r.name == 'Lvl 30 | Emerald');
            msg.member.roles.add(emerald);
        }else if(score.level >= 50){
            let Diamond = msg.guild.roles.cache.find(r => r.name == 'Lvl 50 | Diamond');
            msg.member.roles.add(Diamond);
        }

        const curLevel = Math.floor(0.5 * Math.sqrt(score.points));
        if (score.level < curLevel) {
            score.level++;
            if(score.level >= 5){
                let sodalite = msg.guild.roles.cache.find(r => r.name == "Lvl 5 | Sodalite");
                msg.member.roles.add(sodalite);
            }else if(score.level >= 10){
                let rosequartz = msg.guild.roles.cache.find(r => r.name == 'Lvl 10 | Rose quartz');
                msg.member.roles.add(rosequartz);
            }else if(score.level >= 20){
                let sapphire = msg.guild.roles.cache.find(r => r.name == 'Lvl 20 | Sapphire');
                msg.member.roles.add(sapphire);
            }else if(score.level >= 30){
                let emerald = msg.guild.roles.cache.find(r => r.name == 'Lvl 30 | Emerald');
                msg.member.roles.add(emerald);
            }else if(score.level >= 50){
                let Diamond = msg.guild.roles.cache.find(r => r.name == 'Lvl 50 | Diamond');
                msg.member.roles.add(Diamond);
            }
            const canvas = Canvas.createCanvas(700, 250);
	const ctx = canvas.getContext('2d');


	const background = await Canvas.loadImage('./wallpaper.png');
	ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.strokeStyle ='#74037b';
    ctx.strokeRect(0,0,canvas.width,canvas.height);

    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${msg.author.tag} Leveled up to,`,canvas.width/2.5,canvas.height/3.5)

    ctx.font = applyText(canvas,msg.author.displayName);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`level ${score.level}!`,canvas.width /2.5,canvas.height/1.8);

    ctx.beginPath();
    ctx.arc(125,125,100,0,Math.PI * 2,true);
    ctx.closePath();
    ctx.clip();

    const avatar = await Canvas.loadImage(msg.author.displayAvatarURL({format: "jpg"}));

    ctx.drawImage(avatar,25,25,200,200);

    const attachment = new discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
	msg.channel.send(`You leveled up!`, attachment);
        }
        bot.setScore.run(score);

    }
    if (msg.content.startsWith(prefix) && msg.channel.type != "dm") {
        let args = msg.content.substring(prefix.length).split(' ');
        const logCmd = new discord.MessageEmbed()
            .setTitle(msg.author.tag + " Executed a command in " + msg.channel.name)
            .addField("Message:", msg.content, false)
            .setTimestamp()
            .setColor("RED")
            .setAuthor(bot.user.tag, bot.user.avatarURL({
                dynamic: false,
                format: 'png',
                size: 512
            }))
        let logchannel = msg.guild.channels.cache.find(c => c.name === "logs")
        logchannel.send({
            embed: logCmd
        })
        switch (args[0]) {
            //  commands    

            case 'support':
                if (msg.author.id != bot.user.id && msg.channel.name === "request-support") {

                    const ticketId = Math.floor(Math.random() * 1000000000);
                    const ticketSent = new discord.MessageEmbed()
                        .setTitle("Created ticket!")
                        .setColor("GREEN")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setFooter('Ticket Id: ' + ticketId)
                        .setTimestamp()

                    msg.channel.send({
                        embed: ticketSent
                    }).then(function () {
                        msg.guild.channels.create("❌ Support-Ticket-" + ticketId, {
                            //✅ ❌
                            type: 'test',
                            permissionOverwrites: [{
                                    id: msg.guild.id,
                                    deny: ["VIEW_CHANNEL"]
                                },
                                {
                                    id: msg.author.id,
                                    allow: ["VIEW_CHANNEL"]
                                }
                            ]
                        }).then(function (channel) {
                            channel.setParent(msg.guild.channels.cache.find(c => c.name === "support" && c.type == "category"));
                            const staffrole = msg.guild.roles.cache.find(r => r.name === "-Staff-")
                            channel.send('<@&' + staffrole + '>').then(function (message) {
                                message.react("👍");
                                bot.on('messageReactionAdd', function (reaction, user) {
                                    if (user.id != bot.user.id && reaction.emoji.name === "👍") {
                                        channel.setName("✅ Support-Ticket-" + ticketId + "-" + user.username);
                                        message.delete();
                                        const helpedby = new discord.MessageEmbed()
                                            .setTitle("You're being helped by: " + user.tag)
                                            .setFooter('Ticket Id: ' + ticketId)
                                            .setTimestamp()
                                            .setColor("GREEN")
                                        channel.send({
                                            embed: helpedby
                                        });
                                    }
                                })
                            })
                        })


                    })



                } else if (msg.channel.name != "request-support") {
                    const wrongChannel = new discord.MessageEmbed()
                        .setTitle("Please type the command in the #request-support channel!")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setColor("RED")
                        .setTimestamp()
                    msg.channel.send({
                        embed: wrongChannel
                    })
                }
                break;
            case 'closeticket':
                let user = msg.author.username
                if (msg.channel.name.includes(user.toLowerCase())) {
                    msg.channel.delete();
                }
                break;
            case 'ban':

                if (msg.member.hasPermission("BAN_MEMBERS") && msg.mentions.members.first() != undefined) {
                    msg.mentions.members.first().ban();
                    const bannedMember = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: Banned " + msg.mentions.members.first().displayName)
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setTimestamp()
                        .setColor("GREEN")
                    msg.channel.send({
                        embed: bannedMember
                    })

                } else if (msg.mentions.members.first() === undefined) {
                    const specifyMember = new discord.MessageEmbed()
                        .setTitle(":x: Specify a user to ban!")
                        .setColor("RED")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: specifyMember
                    })
                }
                break;
            case 'kick':

                if (msg.member.hasPermission("KICK_MEMBERS") && msg.mentions.members.first() != undefined) {
                    msg.mentions.members.first().kick();
                    const bannedMember = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: kicked " + msg.mentions.members.first().displayName)
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setTimestamp()
                        .setColor("GREEN")
                    msg.channel.send({
                        embed: bannedMember
                    })

                } else if (msg.mentions.members.first() === undefined) {
                    const specifyMember = new discord.MessageEmbed()
                        .setTitle(":x: Specify a user to kick!")
                        .setColor("RED")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: specifyMember
                    })
                }
                break;
            case 'warn':

                //let towarn = msg.mentions.members.first()
                // let towarnId = msg.mentions.members.first().id
                if (!msg.mentions.members.first()) {
                    const specuser = new discord.MessageEmbed()
                        .setTitle("Specify a user to warn!")
                        .setColor("RED")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setTimestamp()
                    msg.channel.send({
                        embed: specuser
                    })
                } else if (msg.mentions.members.first() != undefined && args[1] != undefined) {
                    let warnmsg = msg.content.substring(args[1].length + 8, msg.content.length);
                    let score = getscore(msg.mentions.members.first().id, msg.guild.id);
                    let warns = JSON.parse(score.warns);
                    console.log("warns " + warns[0])
                    warns.push(warnmsg);
                    score.warns = JSON.stringify(warns)
                    bot.setScore.run(score);
                    const warnedUser = new discord.MessageEmbed()
                        .setTitle(`Warned ${msg.mentions.members.first().displayName} for ${warnmsg}`)
                        .setColor("GREEN")
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                        .setTimestamp()
                    msg.channel.send({
                        embed: warnedUser
                    })

                    // warns.push(warnmsg);
                    //  let warnsdata = JSON.stringify(warns)

                    //  const warnembed = new discord.MessageEmbed()
                    //      .setTitle("Warned " + towarn.displayName + " for " + warnmsg)
                    //     .setColor("GREEN")
                    //     .setAuthor(bot.user.tag, bot.user.avatarURL({
                    //         dynamic: false,
                    //         format: 'png',
                    //         size: 512
                    //     }))
                    //     .setTimestamp()
                    //  msg.channel.send({
                    //     embed: warnembed
                    // })

                }
                break;
            case 'warns':
                if (!msg.mentions.members.first()) {
                    let data = getscore(msg.author.id, msg.guild.id);
                    let warnsData = JSON.parse(data.warns);
                    console.log(warnsData)
                    if (warnsData[0] != undefined) {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.author.username}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                        for (i = 0; i < warnsData.length; i++) {
                            warnsEmb.addField(`Warn ${i+1}`, warnsData[i]);
                        }
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    } else {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.author.username}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                            .setDescription(":white_check_mark: This user has no warns!")
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    }
                } else {
                    let data = getscore(msg.mentions.members.first().id, msg.guild.id);
                    let warnsData = JSON.parse(data.warns);
                    console.log(warnsData)
                    if (warnsData[0] != undefined) {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.mentions.members.first().displayName}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                        for (i = 0; i < warnsData.length; i++) {
                            warnsEmb.addField(`Warn ${i+1}`, warnsData[i]);
                        }
                        msg.channel.send({
                            embed: warnsEmb
                        })
                    } else {
                        let warnsEmb = new discord.MessageEmbed()
                            .setTitle(`${msg.mentions.members.first().displayName}'s Warns`)
                            .setColor("RED")
                            .setTimestamp()
                            .setAuthor(bot.user.tag, bot.user.avatarURL({
                                dynamic: false,
                                format: 'png',
                                size: 512
                            }))
                            .setDescription(":white_check_mark:This user has no warns!")
                        msg.channel.send({
                            warnsEmb
                        })
                    }
                }

                break;
            case 'clearwarns':
                if (!msg.mentions.members.first()) {
                    let score = getscore(msg.author.id, msg.guild.id);
                    let scoreData = JSON.parse(score.warns);

                    scoreData = [];
                    score.warns = JSON.stringify(scoreData);
                    bot.setScore.run(score);
                    const embed = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: Cleared warns for: " + msg.author.username)
                        .setColor("GREEN")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: embed
                    })

                } else {
                    let score = getscore(msg.mentions.members.first().id, msg.guild.id);
                    let scoreData = JSON.parse(score.warns);

                    scoreData = [];
                    score.warns = JSON.stringify(scoreData);
                    bot.setScore.run(score);
                    const embed = new discord.MessageEmbed()
                        .setTitle(":white_check_mark: Cleared warns for: " + msg.mentions.members.first().displayName)
                        .setColor("GREEN")
                        .setTimestamp()
                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                            dynamic: false,
                            format: 'png',
                            size: 512
                        }))
                    msg.channel.send({
                        embed: embed
                    })
                }
                break;
            case 'help':
                let commands = ["purge", "support", "closeticket", "ban", "kick", "warn", "warns", "clearwarns", "help"]
                let descs = [
                    "Used by staff to delete messages in bulk",
                    "Use this command to create a support ticket",
                    "Used by staff to close tickets",
                    "Used to ban members",
                    "Used to kick members",
                    "Used to warn members",
                    "Used to check someone's warns",
                    "Used to clear someone's warns",
                    "Lists all the commands"
                ]
                const helpEmb = new discord.MessageEmbed()
                    .setTitle("Commands:")
                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                        dynamic: false,
                        format: 'png',
                        size: 512
                    }))
                for (i = 0; i < commands.length; i++) {
                    helpEmb.addField(commands[i], descs[i], false)
                }
                helpEmb.setTimestamp()
                helpEmb.setColor("RED");
                msg.channel.send({
                    embed: helpEmb
                })

                break;
            case 'purge':
                if (msg.member.hasPermission("MANAGE_MESSAGES")) {

                    let msgCount = parseInt(args[1]);
                    const limit = 1000;
                    if (msgCount <= limit) {
                        msg.channel.bulkDelete(msgCount + 1);
                    }


                }
                break;
            case 'info':
                const serverinfo = new discord.MessageEmbed()
                    .setTitle("Info on server: " + msg.guild.name)
                    .setColor("RED")
                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                        dynamic: false,
                        format: 'png',
                        size: 512
                    }))
                    .addField("Member count", msg.guild.memberCount, false)
                    .addField("Date made", new Date(msg.guild.createdTimestamp), false)
                    .addField("Discord Owner:", msg.guild.owner, false)
                    .addField("Boosts", msg.guild.premiumSubscriptionCount, false)

                msg.channel.send({
                    embed: serverinfo
                })


                break;
            case 'mute':
                if (msg.member.hasPermission("MUTE_MEMBERS")) {
                    let toMute = msg.mentions.members.first();
                    fs.readFile('./data.json', function (err, data) {
                        let jsondata = JSON.parse(data);
                        oldRoles.set(msg.guild.id + "_" + toMute.id, toMute.roles.cache);
                        console.log(oldRoles.get(msg.guild.id + "_" + toMute.id))
                        let rolescache = oldRoles.get(msg.guild.id + "_" + toMute.id)
                        let aooga = msg.content.substring(args[1].length + 7, msg.content.length);
                        let length = aooga.toLowerCase();
                        console.log(length)
                        if (length.includes("h")) {
                            console.log('hours')
                            length.replace('h', '');
                            length = parseInt(length);
                            length = length * 3600000;
                        } else if (length.includes("d")) {
                            console.log('days')
                            length.replace('d', '');
                            length = parseInt(length);
                            length = length * 86400000;
                        } else if (length.includes("m")) {
                            console.log('minutes')
                            length.replace('m', '');
                            length = parseInt(length);
                            length = length * 60000
                        } else if (length.includes("s")) {
                            console.log('seconds')
                            length.replace('s', '');
                            length = parseInt(length);
                            length = length * 1000
                        }
                        toMute.roles.set([])
                        let muterole = msg.guild.roles.create({
                            data: {
                                name: 'muted',
                                color: 'BLACK',
                                permissions: [],
                            }
                        }).then(function (role) {
                            const discord = require('discord.js');
                            const config = require('./config.json')
                            const bot = new discord.Client()
                            const prefix = ';';
                            const fs = require('fs');
                            const {
                                ifError
                            } = require('assert');
                            bot.on('ready', () => {
                                console.log("Bot online");
                            })

                            // const muteMsg = new discord.MessageEmbed()
                            //        .setTitle(":white_check_mark: Muting "+user.user.tag+" for "+length+" Seconds")
                            //       .setColor("GREEN")
                            //        .setAuthor(bot.user.tag,bot.user.avatarURL({dynamic: false, format: 'png', size: 512}))
                            // templat: member.guild.id+"_"+member.id

                            function update(user, guild, msg) {
                                bot.user.setActivity("Currently moderating " + bot.guilds.cache.size + " server(s).");
                                fs.readFile('./data.json', function (err, data) {
                                    if (err) {
                                        console.log(err)
                                    }
                                    let jsonData = JSON.parse(data);
                                    msg.guild.members.cache.forEach(user => {
                                        let dataNav = guild.id + "_" + user.id;
                                        if (jsonData.data[dataNav] == undefined) {
                                            jsonData.data[dataNav] = {
                                                "warns": [],
                                                "username": user.displayName,
                                                "roles": msg.member.roles.cache
                                            };

                                            let dataWrite = JSON.stringify(jsonData);
                                            fs.writeFileSync('./data.json', dataWrite, function (err) {
                                                console.log(err)
                                            })
                                        }
                                    });
                                })
                            }
                            bot.on('guildMemberAdd', member => {
                                const welcome = new discord.MessageEmbed()
                                    .setTitle("Welcome to the server!")
                                    .setDescription("We hope you have a nice stay and hope to see ya chatting soon! \n if you need help with anything at all be sure to go to the request-support channel and type ;support! a staff members will be with you shortly")
                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                        dynamic: false,
                                        format: 'png',
                                        size: 512
                                    }))
                                    .setColor("RED")

                                member.createDM({
                                    embed: welcome
                                })
                                let role = member.guild.roles.cache.find(r => r.name === "Member");
                                member.roles.add(role);
                                fs.readFile('./data.json', function (err, data) {
                                    const jsonData = JSON.parse(data);
                                    let dataNav = member.guild.id + "_" + member.id;
                                    if (jsonData.data[dataNav] == undefined) {
                                        jsonData.data[dataNav] = {
                                            "warns": [],
                                            "username": member.displayName,
                                            "roles": member.roles.cache
                                        }
                                        let dataWrite = JSON.stringify(jsonData);
                                        fs.writeFile('./data.json', dataWrite, function (err) {
                                            console.log(err)
                                        })
                                    }
                                })

                            })
                            let oldRoles = new Map();
                            bot.on('message', msg => {
                                update(msg.author, msg.guild, msg);
                                if (msg.content.startsWith(prefix) && msg.channel.type != "dm") {
                                    let args = msg.content.substring(prefix.length).split(' ');
                                    const logCmd = new discord.MessageEmbed()
                                        .setTitle(msg.author.tag + " Executed a command in " + msg.channel.name)
                                        .addField("Message:", msg.content, false)
                                        .setTimestamp()
                                        .setColor("RED")
                                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                                            dynamic: false,
                                            format: 'png',
                                            size: 512
                                        }))
                                    let logchannel = msg.guild.channels.cache.find(c => c.name === "logs")
                                    logchannel.send({
                                        embed: logCmd
                                    })
                                    switch (args[0]) {
                                        //  commands    

                                        case 'support':
                                            if (msg.author.id != bot.user.id && msg.channel.name === "request-support") {

                                                const ticketId = Math.floor(Math.random() * 1000000000);
                                                const ticketSent = new discord.MessageEmbed()
                                                    .setTitle("Created ticket!")
                                                    .setColor("GREEN")
                                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                    .setFooter('Ticket Id: ' + ticketId)
                                                    .setTimestamp()

                                                msg.channel.send({
                                                    embed: ticketSent
                                                }).then(function () {
                                                    msg.guild.channels.create("❌ Support-Ticket-" + ticketId, {
                                                        //✅ ❌
                                                        type: 'test',
                                                        permissionOverwrites: [{
                                                                id: msg.guild.id,
                                                                deny: ["VIEW_CHANNEL"]
                                                            },
                                                            {
                                                                id: msg.author.id,
                                                                allow: ["VIEW_CHANNEL"]
                                                            }
                                                        ]
                                                    }).then(function (channel) {
                                                        channel.setParent(msg.guild.channels.cache.find(c => c.name === "support" && c.type == "category"));
                                                        const staffrole = msg.guild.roles.cache.find(r => r.name === "-Staff-")
                                                        channel.send('<@&' + staffrole + '>').then(function (message) {
                                                            message.react("👍");
                                                            bot.on('messageReactionAdd', function (reaction, user) {
                                                                if (user.id != bot.user.id && reaction.emoji.name === "👍") {
                                                                    channel.setName("✅ Support-Ticket-" + ticketId + "-" + user.username);
                                                                    message.delete();
                                                                    const helpedby = new discord.MessageEmbed()
                                                                        .setTitle("You're being helped by: " + user.tag)
                                                                        .setFooter('Ticket Id: ' + ticketId)
                                                                        .setTimestamp()
                                                                        .setColor("GREEN")
                                                                    channel.send({
                                                                        embed: helpedby
                                                                    });
                                                                }
                                                            })
                                                        })
                                                    })


                                                })



                                            } else if (msg.channel.name != "request-support") {
                                                const wrongChannel = new discord.MessageEmbed()
                                                    .setTitle("Please type the command in the #request-support channel!")
                                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                    .setColor("RED")
                                                    .setTimestamp()
                                                msg.channel.send({
                                                    embed: wrongChannel
                                                })
                                            }
                                            break;
                                        case 'closeticket':
                                            let user = msg.author.username
                                            if (msg.channel.name.includes(user.toLowerCase())) {
                                                msg.channel.delete();
                                            }
                                            break;
                                        case 'ban':

                                            if (msg.member.hasPermission("BAN_MEMBERS") && msg.mentions.members.first() != undefined) {
                                                msg.mentions.members.first().ban();
                                                const bannedMember = new discord.MessageEmbed()
                                                    .setTitle(":white_check_mark: Banned " + msg.mentions.members.first().displayName)
                                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                    .setTimestamp()
                                                    .setColor("GREEN")
                                                msg.channel.send({
                                                    embed: bannedMember
                                                })

                                            } else if (msg.mentions.members.first() === undefined) {
                                                const specifyMember = new discord.MessageEmbed()
                                                    .setTitle(":x: Specify a user to ban!")
                                                    .setColor("RED")
                                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                msg.channel.send({
                                                    embed: specifyMember
                                                })
                                            }
                                            break;
                                        case 'kick':

                                            if (msg.member.hasPermission("KICK_MEMBERS") && msg.mentions.members.first() != undefined) {
                                                msg.mentions.members.first().kick();
                                                const bannedMember = new discord.MessageEmbed()
                                                    .setTitle(":white_check_mark: kicked " + msg.mentions.members.first().displayName)
                                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                    .setTimestamp()
                                                    .setColor("GREEN")
                                                msg.channel.send({
                                                    embed: bannedMember
                                                })

                                            } else if (msg.mentions.members.first() === undefined) {
                                                const specifyMember = new discord.MessageEmbed()
                                                    .setTitle(":x: Specify a user to kick!")
                                                    .setColor("RED")
                                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                msg.channel.send({
                                                    embed: specifyMember
                                                })
                                            }
                                            break;
                                        case 'warn':
                                            fs.readFile('./data.json', function (err, data) {
                                                let JSONdata = JSON.parse(data)
                                                let towarn = msg.mentions.members.first()
                                                let towarnId = msg.mentions.members.first().id
                                                let warns = JSONdata.data[msg.guild.id + "_" + towarnId].warns
                                                let warnmsg = msg.content.substring(args[1].length + 8, msg.content.length);
                                                if (warnmsg === "" || undefined) {
                                                    warnmsg = "No reason"
                                                }
                                                warns.push(warnmsg);
                                                let warnsdata = JSON.stringify(JSONdata)
                                                fs.writeFile('./data.json', warnsdata, function (err) {

                                                });
                                                const warnembed = new discord.MessageEmbed()
                                                    .setTitle("Warned " + towarn.displayName + " for " + warnmsg)
                                                    .setColor("GREEN")
                                                    .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                    .setTimestamp()
                                                msg.channel.send({
                                                    embed: warnembed
                                                })
                                            })

                                            break;
                                        case 'warns':
                                            fs.readFile('./data.json', function (err, data) {
                                                let jsonData = JSON.parse(data);

                                                const warnsemb = new discord.MessageEmbed()
                                                if (msg.mentions.members.first() != undefined) {
                                                    let warns = jsonData.data[msg.guild.id + "_" + msg.mentions.members.first().id].warns;
                                                    warnsemb.setTitle(msg.mentions.members.first().displayName + "'s warns");
                                                    if (warns[0] != undefined) {
                                                        for (i = 0; i < warns.length; i++) {
                                                            warnsemb.addField("Warn" + (i + 1), warns[i], false)
                                                        }
                                                    } else {
                                                        warnsemb.addField("This user has no warns!")
                                                    }
                                                    warnsemb.setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                    warnsemb.setColor("GREEN")
                                                    msg.channel.send({
                                                        embed: warnsemb
                                                    })
                                                } else {
                                                    let warns = jsonData.data[msg.guild.id + "_" + msg.author.id].warns;
                                                    warnsemb.setTitle(msg.author + "'s warns");
                                                    if (warns[0] != undefined) {
                                                        for (i = 0; i < warns.length; i++) {
                                                            warnsemb.addField("Warn" + (i + 1), warns[i], false)
                                                        }
                                                    } else {
                                                        warnsemb.addField("This user has no warns!")
                                                    }
                                                    warnsemb.setAuthor(bot.user.tag, bot.user.avatarURL({
                                                        dynamic: false,
                                                        format: 'png',
                                                        size: 512
                                                    }))
                                                    warnsemb.setColor("GREEN")
                                                    msg.channel.send({
                                                        embed: warnsemb
                                                    })
                                                }



                                            })
                                            break;
                                        case 'update':
                                            if (msg.member.hasPermission("ADMINISTRATOR")) {
                                                fs.readFile('./data.json', function (err, data) {
                                                    let jsonData = JSON.parse(data);
                                                    msg.guild.members.cache.forEach(user => {
                                                        let dataNav = user.guild.id + "_" + user.id;
                                                        if (jsonData.data[dataNav] == undefined) {
                                                            jsonData.data[dataNav] = {
                                                                "warns": [],
                                                                "username": user.displayName,
                                                                "roles": user.roles.cache
                                                            };

                                                            let dataWrite = JSON.stringify(jsonData);
                                                            fs.writeFile('./data.json', dataWrite, function (err) {
                                                                console.log(err)
                                                            })
                                                        }
                                                    });
                                                })
                                            }


                                            break;
                                        case 'clearwarns':
                                            fs.readFile('./data.json', function (err, data) {
                                                let jsondata = JSON.parse(data);
                                                if (!msg.mentions.members.first()) {
                                                    jsondata.data[msg.guild.id + "_" + msg.author.id].warns = [];

                                                    ooga = JSON.stringify(jsondata)
                                                    fs.writeFile('./data.json', ooga, function (err) {})
                                                    const cleared = new discord.MessageEmbed()
                                                        .setTitle('Cleared warns for ' + msg.author.tag)
                                                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                            dynamic: false,
                                                            format: 'png',
                                                            size: 512
                                                        }))
                                                        .setColor("GREEN")
                                                        .setTimestamp()
                                                    msg.channel.send({
                                                        embed: cleared
                                                    })
                                                } else {
                                                    jsondata.data[msg.guild.id + "_" + msg.author.id].warns = [];

                                                    ooga = JSON.stringify(jsondata)
                                                    fs.writeFile('./data.json', ooga, function (err) {})
                                                    const cleared = new discord.MessageEmbed()
                                                        .setTitle('Cleared warns for ' + msg.mentions.members.first().displayName)
                                                        .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                            dynamic: false,
                                                            format: 'png',
                                                            size: 512
                                                        }))
                                                        .setColor("GREEN")
                                                        .setTimestamp()
                                                    msg.channel.send({
                                                        embed: cleared
                                                    })
                                                }
                                            })
                                            break;
                                        case 'help':
                                            let commands = ["purge", "support", "closeticket", "ban", "kick", "warn", "warns", "clearwarns", "help"]
                                            let descs = [
                                                "Used by staff to delete messages in bulk",
                                                "Use this command to create a support ticket",
                                                "Used by staff to close tickets",
                                                "Used to ban members",
                                                "Used to kick members",
                                                "Used to warn members",
                                                "Used to check someone's warns",
                                                "Used to clear someone's warns",
                                                "Lists all the commands"
                                            ]
                                            const helpEmb = new discord.MessageEmbed()
                                                .setTitle("Commands:")
                                                .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                    dynamic: false,
                                                    format: 'png',
                                                    size: 512
                                                }))
                                            for (i = 0; i < commands.length; i++) {
                                                helpEmb.addField(commands[i], descs[i], false)
                                            }
                                            helpEmb.setTimestamp()
                                            helpEmb.setColor("RED");
                                            msg.channel.send({
                                                embed: helpEmb
                                            })

                                            break;
                                        case 'purge':
                                            if (msg.member.hasPermission("MANAGE_MESSAGES")) {

                                                let msgCount = parseInt(args[1]);
                                                const limit = 1000;
                                                if (msgCount <= limit) {
                                                    msg.channel.bulkDelete(msgCount + 1);
                                                }


                                            }
                                            break;
                                        case 'info':
                                            const serverinfo = new discord.MessageEmbed()
                                                .setTitle("Info on server: " + msg.guild.name)
                                                .setColor("RED")
                                                .setAuthor(bot.user.tag, bot.user.avatarURL({
                                                    dynamic: false,
                                                    format: 'png',
                                                    size: 512
                                                }))
                                                .addField("Member count", msg.guild.memberCount, false)
                                                .addField("Date made", new Date(msg.guild.createdTimestamp), false)
                                                .addField("Discord Owner:", msg.guild.owner, false)
                                                .addField("Boosts", msg.guild.premiumSubscriptionCount, false)

                                            msg.channel.send({
                                                embed: serverinfo
                                            })


                                            break;
                                        case 'mute':
                                            if (msg.member.hasPermission("MUTE_MEMBERS")) {
                                                let toMute = msg.mentions.members.first();
                                                fs.readFile('./data.json', function (err, data) {
                                                    let jsondata = JSON.parse(data);
                                                    oldRoles.set(msg.guild.id + "_" + toMute.id, toMute.roles.cache);
                                                    console.log(oldRoles.get(msg.guild.id + "_" + toMute.id))
                                                    let rolescache = oldRoles.get(msg.guild.id + "_" + toMute.id)
                                                    let aooga = msg.content.substring(args[1].length + 7, msg.content.length);
                                                    let length = aooga.toLowerCase();
                                                    console.log(length)
                                                    if (length.includes("h")) {
                                                        console.log('hours')
                                                        length.replace('h', '');
                                                        length = parseInt(length);
                                                        length = length * 3600000;
                                                    } else if (length.includes("d")) {
                                                        console.log('days')
                                                        length.replace('d', '');
                                                        length = parseInt(length);
                                                        length = length * 86400000;
                                                    } else if (length.includes("m")) {
                                                        console.log('minutes')
                                                        length.replace('m', '');
                                                        length = parseInt(length);
                                                        length = length * 60000
                                                    } else if (length.includes("s")) {
                                                        console.log('seconds')
                                                        length.replace('s', '');
                                                        length = parseInt(length);
                                                        length = length * 1000
                                                    }
                                                    toMute.roles.set([])
                                                    let muterole = msg.guild.roles.create({
                                                        data: {
                                                            name: 'muted',
                                                            color: 'BLACK',
                                                            permissions: [],
                                                        }
                                                    }).then(function (role) {

                                                        toMute.roles.add(role);
                                                        msg.channel.send("muted?")
                                                        setTimeout(() => {
                                                            msg.channel.send("unmuted?")
                                                            toMute.roles.set(rolescache);
                                                            role.delete();
                                                        }, length);
                                                    })



                                                })
                                            }
                                            break;
                                    }


                                }

                            })

                            toMute.roles.add(role);
                            msg.channel.send("muted?")
                            setTimeout(() => {
                                msg.channel.send("unmuted?")
                                toMute.roles.set(rolescache);
                                role.delete();
                            }, length);
                        })



                    })
                }
                break;
            case 'level':
                if(msg.mentions.members.first() != undefined){
                    let score = getscore(msg.mentions.members.first().id,msg.guild.id);
                    const canvas = Canvas.createCanvas(700, 250);
                    const ctx = canvas.getContext('2d');
                
                
                    const background = await Canvas.loadImage('./wallpaper.png');
                    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                
                    ctx.strokeStyle ='#74037b';
                    ctx.strokeRect(0,0,canvas.width,canvas.height);
                
                    ctx.font = '28px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`${msg.mentions.members.first().user.tag}'s level:`,canvas.width/2.5,canvas.height/3.5)
                
                    ctx.font = applyText(canvas,msg.author.displayName);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`level ${score.level}`,canvas.width /2.5,canvas.height/1.8);
                
                    ctx.beginPath();
                    ctx.arc(125,125,100,0,Math.PI * 2,true);
                    ctx.closePath();
                    ctx.clip();
                
                    const avatar = await Canvas.loadImage(msg.mentions.members.first().user.displayAvatarURL({format: "jpg"}));
                
                    ctx.drawImage(avatar,25,25,200,200);
                
                    const attachment = new discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
                    msg.channel.send(`<@${msg.mentions.members.first().id}> is level`,attachment);

                }else{
                    let score = getscore(msg.author.id,msg.guild.id);
                    const canvas = Canvas.createCanvas(700, 250);
                    const ctx = canvas.getContext('2d');
                
                
                    const background = await Canvas.loadImage('./wallpaper.png');
                    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
                
                    ctx.strokeStyle ='#74037b';
                    ctx.strokeRect(0,0,canvas.width,canvas.height);
                
                    ctx.font = '28px sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`${msg.author.tag}'s level:`,canvas.width/2.5,canvas.height/3.5)
                
                    ctx.font = applyText(canvas,msg.author.displayName);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`level ${score.level}`,canvas.width /2.5,canvas.height/1.8);
                
                    ctx.beginPath();
                    ctx.arc(125,125,100,0,Math.PI * 2,true);
                    ctx.closePath();
                    ctx.clip();
                
                    const avatar = await Canvas.loadImage(msg.author.displayAvatarURL({format: "jpg"}));
                
                    ctx.drawImage(avatar,25,25,200,200);
                
                    const attachment = new discord.MessageAttachment(canvas.toBuffer(), 'welcome-image.png');
                    msg.channel.send(`<@${msg.author.id}> is level`,attachment);
                        
                    

                }
            break;
            case 'join':
                bot.emit('guildMemberAdd',msg.member);
            break;
            case 'sendembed':
                if(msg.member.hasPermission("ADMINISTRATOR")){
                    msg.channel.send("What ")
                }
            break;
        }


    }

})



bot.login(config.token);