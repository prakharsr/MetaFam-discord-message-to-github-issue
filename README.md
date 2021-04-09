# Issues Bot

For Gitcoin's hackathon https://gitcoin.co/issue/MetaFam/fix-the-world/2/100025495. I used discord's API to create a bot which will listen for messages on all the channels of a user and if any reply of the kind "issuize to repo X" to a message containing an issue is made, then it will check if the repo's name is correct according to github's naming conventions then it'll publish that issue to that repo and will reply to the user's message telling him that it has succeeded.

Example format for issue message : `issue related to something (title) | content of the issue (body)`
Example format for replying to issue : `issuize to repo MetaFam-discord-message-to-github-issue`

![Working Example](./example.png?raw=true "Working Example")

# Obtaining access tokens and adding them to keys.js

1. Create a copy of keys.template.js to keys.js using `cp keys.template.js keys.js`
2. Create a Personal access token for Github from https://github.com/settings/tokens. Copy the token and paste in the field GITHUB_PERSONAL_ACCESS_TOKEN in keys.js
3. Create a Bot and token for Discord. Instructions are at https://discordpy.readthedocs.io/en/latest/discord.html. Copy the token and paste in the field DISCORD_BOT_TOKEN in keys.js. Invite your bot, insrtuctions are at https://discordpy.readthedocs.io/en/latest/discord.html#inviting-your-bot.
4. Put your Github username in the field GITHUB_REPO_OWNER_USERNAME in keys.js

## Instructions to run locally

1. Complete the above step for obtaining access tokens and adding them to keys.js
2. run `npm install`
3. run `npm start`

## Instructions for deploying using Docker

1. Complete the above step for obtaining access tokens and adding them to keys.js
2. run `docker build -t <your_username>/issuesbot`
3. run `docker run -d <your_username>/issuesbot:latest`
