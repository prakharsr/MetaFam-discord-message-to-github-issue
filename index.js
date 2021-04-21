const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const API_KEYS = require('./keys');
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
    auth: API_KEYS.GITHUB_PERSONAL_ACCESS_TOKEN
  });
const IMAGE_REPO_NAME = "metagame-wiki";
const IMAGE_REPO_BRANCH = "imageBranch";
const { readdirSync } = require('fs');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const download_image = (url, image_path) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  );

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
    try {
        if (msg.content.match(/issuize to repo(.*?)/g)) {

            // create an issue for a repo
            console.log("creating an issue for a repo")

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
                    await octokit.rest.issues.create({
                        owner: repoOwner,
                        repo: repoName,
                        title: githubIssueTitle,
                        body: githubIssueBody
                        }).then(() => {
                            msg.reply('Github issue creation succeded !').catch(console.error);
                        }).catch(err => {
                            msg.reply(`Github issue creation failed ! Encountered error : ${err}`).catch(console.error);
                            return;
                        })
                }
                else {
                    console.log(`Github issue creation failed ! Repo Name is not valid !`);
                    msg.reply('Github issue creation failed ! Repo Name is not valid !').catch(console.error);
                    return;
                }
            }
        }
        else if (msg.content.match(/create pr(.*?)/g)) {

            // create a pull request for an image
            console.log("creating a pull request for an image")

            let attachmentsMap = msg.attachments;
            if(attachmentsMap.size < 1) {
                console.log(`Github Pull Request creation failed ! No image has been attached !`);
                msg.reply(`Github Pull Request creation failed ! No image has been attached !`).catch(console.error);
                return;
            }

            // check if IMAGE_REPO_BRANCH exists

            let revisionHashes = await octokit.request('GET /repos/{owner}/{repo}/git/refs/heads', {
                owner: API_KEYS.GITHUB_REPO_OWNER_USERNAME,
                repo: IMAGE_REPO_NAME
              }).catch((error) => {
                console.log(error);
                msg.reply(`Github Pull Request creation failed ! Encountered error : ${error}`).catch(console.error);
                return;
            })

            if(!revisionHashes.data.find(obj => obj.ref == `refs/heads/${IMAGE_REPO_BRANCH}`)) {

                // IMAGE_REPO_BRANCH not found, creating IMAGE_REPO_BRANCH
                console.log(`${IMAGE_REPO_BRANCH} not found, creating ${IMAGE_REPO_BRANCH}`)

                // SHA1 hash of the master branch

                let revisionHash = revisionHashes.data.find(ref => ref.ref == 'refs/heads/master').object.sha; 

                // creating IMAGE_REPO_BRANCH
                
                await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
                    owner: API_KEYS.GITHUB_REPO_OWNER_USERNAME,
                    repo: IMAGE_REPO_NAME,
                    ref: `refs/heads/${IMAGE_REPO_BRANCH}`,
                    sha: revisionHash
                }).catch((error) => {
                    console.log(error);
                    msg.reply(`Github Pull Request creation failed ! Encountered error : ${error}`).catch(console.error);
                    return;
                })
            }

            // going through all attachments
            
            for(let i=0; i<attachmentsMap.size; i++) {
                let attachment = attachmentsMap.get(attachmentsMap.keys().next().value);
                let fileURL = attachment.attachment;
                let filename = attachment.name;      
                
                // downloading image from url and saving it to ./images folder

                await download_image(fileURL, `images${path.sep}${filename}`).then(async () => {
                    
                    // read image file as base64

                    const data = fs.readFileSync(`images${path.sep}${filename}`,{encoding: 'base64'});

                    // find blob sha hash of the file, required if we are updating

                    let blob = await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
                        owner: API_KEYS.GITHUB_REPO_OWNER_USERNAME,
                        repo: IMAGE_REPO_NAME,
                        content: data,
                        encoding: "base64"
                    }).catch((error) => {
                        console.log(error);
                        msg.reply(`Github Pull Request creation failed ! Encountered error : ${error}`).catch(console.error);
                        return;
                    })

                    let shaHash = blob.data.sha;

                    // create commit on IMAGE_REPO_BRANCH with image file 

                    await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
                        owner: API_KEYS.GITHUB_REPO_OWNER_USERNAME,
                        repo: IMAGE_REPO_NAME,
                        branch: IMAGE_REPO_BRANCH,
                        path: `static/img/${filename}`,
                        message: `add image ${filename}`,
                        sha: shaHash,
                        content: data
                    }).catch((error) => {
                        console.log(error);
                        msg.reply(`Github Pull Request creation failed ! Encountered error : ${error}`).catch(console.error);
                        return;
                    })

                    // create a pull request
                    
                    await octokit.rest.pulls.create({
                        owner: API_KEYS.GITHUB_REPO_OWNER_USERNAME,
                        repo: IMAGE_REPO_NAME,
                        title: `add image ${filename}`,
                        head: IMAGE_REPO_BRANCH,
                        base: "master"
                    }).then(()=> {
                        console.log(`Github Pull Request creation succeeded !`)
                        msg.reply(`Github Pull Request creation succeeded !`).catch(console.error);
                    }).catch((error) => {
                        console.log(error);
                        msg.reply(`Github Pull Request creation failed ! Encountered error : ${error}`).catch(console.error);
                        return;
                    })

                }).catch((error) => {
                    console.error(error);
                    msg.reply(`Github Pull Request creation failed ! Encountered error : ${error}`).catch(console.error);
                })
            }
        }
    } catch (error) {
        console.error("Encountered error !", error);
        msg.reply(`Github Pull Request creation failed ! Encountered error : ${error}`).catch(console.error);
    }
});

client.login(API_KEYS.DISCORD_BOT_TOKEN);