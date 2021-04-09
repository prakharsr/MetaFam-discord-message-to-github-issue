const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const API_KEYS = require('./keys');
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
    auth: API_KEYS.GITHUB_PERSONAL_ACCESS_TOKEN
  });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    try {
        if (msg.content.match(/issuize to repo(.*?)/g)) {
            // check if the message is a reply
            if(!msg.reference) {
                // its not a reply, send a reply indicating failure 
                msg.reply(`Github issue creation failed ! No parent message found ! Please reply to a message containing the issue to post the issue to Github`).catch(console.error);
            }
            else {
                // its a reply, fetch the parent message denoting the issue
                client.channels.fetch(msg.channel.id).then(channel => {
                    let parentMessageId = msg.reference.messageID;
                    channel.messages.fetch(parentMessageId).then(message => {
                        githubIssueTitle = message.content;
                        console.log(`The issue title to post to Github is : ${githubIssueTitle}`);
                        let repoName = msg.content.split("issuize to repo")[1].trim();
                        if(!repoName || repoName.length === 0 ) {
                            console.log(`Github issue creation failed ! Repo Name is empty or null or undefined`);
                            msg.reply(`Github issue creation failed ! Repo Name is empty or null or undefined`).catch(console.error);
                        }
                        else {
                            // check if repo name is valid according to gihub's naming conventions
                            if(repoName.match(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i)) {
                                console.log(`Repo Name is : ${repoName}`);
                                let repoOwner = API_KEYS.GITHUB_REPO_OWNER_USERNAME;
                                octokit.rest.issues.create({
                                    owner: repoOwner,
                                    repo: repoName,
                                    title: githubIssueTitle,
                                  }).then(() => {
                                    msg.reply('Github issue creation succeded !').catch(console.error);
                                  }).catch(err => console.error(err))
                            }
                            else {
                                console.log(`Github issue creation failed ! Repo Name is not valid !`);
                                msg.reply('Github issue creation failed ! Repo Name is not valid !').catch(console.error);
                            }
                        }
                    }).catch(console.error);
                }).catch(console.error);
            }
        }

    } catch (error) {
        console.error("Encountered error !", error)
    }
});

client.login(API_KEYS.DISCORD_BOT_TOKEN);