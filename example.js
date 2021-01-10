const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client, Message } = require('whatsapp-web.js');
const { join } = require('path');
const { exception } = require('console');
const crypto = require('crypto');

// Path where the session data will be stored
const SESSION_FILE_PATH = './session.json';

// get arguments
const args = process.argv.slice(2)

if (args.length < 2) {
    throw "Not enough arguments provided. Needs 'Chatname' and 'Outputdirectory'"
}

const CHATNAME = args[0];

const DOWNLOADS_PATH = args[1];

if (!fs.existsSync(DOWNLOADS_PATH)) {
    fs.mkdirSync(DOWNLOADS_PATH);
}


// Load the session data if it has been previously saved
let sessionData;
if(fs.existsSync(SESSION_FILE_PATH)) {
    sessionData = require(SESSION_FILE_PATH);
}

// Use the saved values
const client = new Client({
    session: sessionData
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

function storeMessages(chatpath) {
    return async function(messages) {
        let msgs = messages.map(m => new Message(client, m))

        for (let message of msgs) {
            const filename = `${message.timestamp}.json`
            const filepath = [chatpath, filename].join("/")

            if (fs.existsSync(filepath)) continue;

            const contact = await message.getContact()

            const content = {
                author: {
                    name: contact.name,
                    pushname: contact.pushname,
                    shortname: contact.shortName
                },
                body: message.body,
                timestamp: message.timestamp
            }

            if(message.hasMedia) {
                try {
                    mediapath = [chatpath, "media"].join("/")

                    if (!fs.existsSync(mediapath)) {
                        fs.mkdirSync(mediapath);
                    }

                    const media = await message.downloadMedia();
                    // do something with the media data here

                    const mimetypeParts = media.mimetype.split("/");

                    if (mimetypeParts.length != 2) {
                        throw `Unrecognized mimetype '${media.mimetype}'`
                    }

                    var shasum = crypto.createHash('sha1')
                    shasum.update(JSON.stringify(content))

                    let extension = mimetypeParts.pop();

                    if (extension.includes(";")) {
                        const extension_parts = extension.split(";")

                        extension = extension_parts.shift()
                    }

                    const mediafilename = `${shasum.digest('hex')}.${extension}`
                    const mediafilepath = [mediapath, mediafilename].join("/")

                    const data = new Buffer.from(media.data, 'base64')

                    fs.writeFile(mediafilepath, data, function(err) {
                        if (err) {
                            console.error(err);
                        }
                    });

                    content.media = {
                        name: mediafilename,
                        mimetype: media.mimetype
                    }
                } catch(error) {
                    console.error(error)
                }                
            }

            console.log(`${content.author.name || content.author.shortname}:\n${content.body}`)
            
            if (!fs.existsSync(filepath)) {
                fs.writeFile(filepath, JSON.stringify(content, null, "\t"), (err) => {
                    if (err) {
                        console.error(err);
                    }
                })
            }
        }
    }    
}

client.on('ready', async () => {
    console.log('Client is ready!');

    const chats = await client.getChats()

    let found = false

    for (let chat of chats) {
        console.info(`Found chat '${chat.name}'`)
        if (chat.name == CHATNAME) {
            let found = true

            // create directory for chat
            chatpath = [DOWNLOADS_PATH, chat.name].join("/")

            if (!fs.existsSync(chatpath)) {
                fs.mkdirSync(chatpath);
            }

            const storeMessagesCallback = storeMessages(chatpath)

            // expose storeMessagesCallback
            await client.pupPage.exposeFunction("storeMessagesCallback", storeMessagesCallback)
        
            await client.pupPage.evaluate(async (chatId) => {
                const msgFilter = m => !m.isNotification; // dont include notification messages
    
                const chat = window.Store.Chat.get(chatId);
                let msgs = chat.msgs.models.filter(msgFilter);

                // store current messages
                msgs = msgs.map(m => window.WWebJS.getMessageModel(m))

                await storeMessagesCallback(msgs)

                let counter = 0;

                while (true) {
                    const loadedMessages = await chat.loadEarlierMsgs();
                    if (!loadedMessages) break;

                    // if (counter > 100) break;

                    let loadedMsgs = loadedMessages.filter(msgFilter)
                    loadedMsgs = loadedMsgs.map(m => window.WWebJS.getMessageModel(m))
                    
                    await storeMessagesCallback(loadedMsgs)

                    counter++;
                }        
            }, chat.id._serialized)
        }
    }

    if (!found) {
        console.warn(`Unable to find chat with name '${CHATNAME}'`)
    }

    process.exit(0)
});

// Save session values to the file upon successful auth
client.on('authenticated', (session) => {
    sessionData = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.initialize();