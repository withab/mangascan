const Discord = require('discord.js')
const client = new Discord.Client()

client.login('ODQyNzc5NjA1MDE0MjgyMjQw.YJ6Rqw.bSRepkGaqh7ikwIxmF8LxopT4yA')

client.on('ready',() => console.log(`Logged in as ${client.user.tag}`))

client.on('message', async message => {

    if(!message.content.startsWith('$read')) return;
    let args = message.content.split(' ')
    args.shift()

    let embed = new Discord.MessageEmbed()
        .setTitle('Manga reader')
        .setColor('GREEN')
        .setDescription('**Utilisation**: **$read <manga title> [chapter] [page]**\n' + 
            '(<> = obligatory; [] = optional)\n' + 
            'In manga title, replace space by "-"\n' + 
            '**Example**: **One piece**: **one-piece** => __**$read one-piece 1019 1**__ => **Read One piece chapter 1019 page 1**\n' + 
            'Note: Chapter 1 of a manga may be unavailable but the last chapter may still be available\n' + 
            'Have fun ¯\\_(ツ)_/¯')
        .setFooter('By withan')
        .setTimestamp()

    if(!args[0]) return message.channel.send(embed)

    let manga = args[0].toLowerCase()
    let chapter = parseInt(args[1]) || 1
    let page = parseInt(args[2]) || 1

    let exist = await pageExist(manga, chapter, page)

    if(!exist) message.channel.send('Manga, chapter or page isn\'t found.')
    else message.channel.send(getEmbed(manga, chapter, page)).then(msg => {
        
        msg.react('⏪')
        msg.react('⬅️')
        msg.react('➡️')
        msg.react('⏩')
        msg.react('❌')

        client.on('messageReactionAdd', async (reaction, user) => {
            if(reaction.message.id != msg.id) return;
            if(user.id != message.author.id) return;            
            
            if(reaction.emoji.name == "❌") {
                msg.edit('End of the reading session.')
                msg.reactions.removeAll()
            } else {

                if(reaction.emoji.name == "⏪") {
                    chapter --
                    page = 1
                }
                if(reaction.emoji.name == "⬅️") page --
                if(reaction.emoji.name == "➡️") page ++
                if(reaction.emoji.name == "⏩") {
                    chapter ++
                    page = 1
                }
    
                exist = await pageExist(manga, chapter, page)
    
                if(!exist) {
                    let nextChapExist = await pageExist(manga, chapter + 1, 1)
                    let previousChapExist = await pageExist(manga, chapter - 1, 1)
                
                    if(reaction.emoji.name == "➡️" && nextChapExist) {
                        chapter ++ 
                        page = 1
                        msg.edit(getEmbed(manga, chapter, page))
                    } else if(reaction.emoji.name == "⬅️" && previousChapExist) {
                        chapter -- 
                        page = 1
                        msg.edit(getEmbed(manga, chapter, page))
                    } else {
                        if(reaction.emoji.name == "⏪") chapter ++
                        if(reaction.emoji.name == "⬅️") page ++
                        if(reaction.emoji.name == "➡️") page --
                        if(reaction.emoji.name == "⏩") chapter --
                        msg.edit(getEmbed(manga, chapter, page, 'RED'))
                    }
                }
                else msg.edit(getEmbed(manga, chapter, page))
    
                msg.reactions.resolve(reaction.emoji.name).users.remove(message.author.id);
    

            }
        })
    })
})

async function pageExist (manga, chapter, page) {

    return new Promise((resolve, reject) => {
        getPage(manga, chapter, page)
        .then(() => {
            resolve(true)
        })
        .catch(() => {
            resolve(false)
        })
    })

}

function getEmbed(manga, chapter, page, color = "BLACK") {
    let embed = new Discord.MessageEmbed()
        .setTitle(`${up(manga).replace(/-/gi, ' ')} - Chapter ${chapter} - Page ${page}`)
        .setColor(color)
        .setImage(`https://scansmangas.xyz/scans/${manga}/${chapter}/${page}.jpg`)
        .setFooter('By withan')
        .setTimestamp()
        
    return embed
}

function up(a){return (a+'').charAt(0).toUpperCase()+a.substr(1);}

const request = require('snekfetch');

function getPage(manga, chapter, page) {

    return new Promise((resolve, reject) => {
        request.get(`https://scansmangas.xyz/scans/${manga}/${chapter}/${page}.jpg`)
            .then(r => resolve(r.body))
            .catch(err => reject(err))
    })
 
}