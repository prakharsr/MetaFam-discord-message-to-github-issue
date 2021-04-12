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
            if(msg.content.split("|").length < 3) {
                msg.reply(`Github issue creation failed ! The message must be of the format : "issuize to repo X | issue title | issue body"`).catch(console.error);
                return;
            }
            let repoName = msg.content.split("issuize to repo")[1].split("|")[0].trim();
            let githubIssueTitle = msg.content.split("|")[1].trim();
            let githubIssueBody = msg.content.split("|")[2].trim();
            if(!repoName || repoName.length === 0 ) {
                console.log(`Github issue creation failed ! Repo Name is empty or null or undefined`);
                msg.reply(`Github issue creation failed ! Repo Name is empty or null or undefined`).catch(console.error);
                return;
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
                        body: githubIssueBody
                        }).then(() => {
                        msg.reply('Github issue creation succeded !').catch(console.error);
                        }).catch(err => console.error(err))
                }
                else {
                    console.log(`Github issue creation failed ! Repo Name is not valid !`);
                    msg.reply('Github issue creation failed ! Repo Name is not valid !').catch(console.error);
                    return;
                }
            }
        }

    } catch (error) {
        console.error("Encountered error !", error);
        msg.reply(`Github issue creation failed ! Encountered an error : ${error}`).catch(console.error);
    }
});

client.login(API_KEYS.DISCORD_BOT_TOKEN);