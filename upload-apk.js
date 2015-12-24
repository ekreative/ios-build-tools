#!/usr/bin/env node
'use strict';

const fetch = require('node-fetch'),
    FormData = require('form-data'),
    fs = require('fs'),
    child_process = require('child_process'),
    winston = require('winston'),
    program = require('commander'),

    slack = require('./lib/slack');

program
    .version(require('./package.json').version)
    .option('-p, --project-id <id>', 'Project Id', parseInt, process.env.PROJECT_ID)
    .option('-f, --project-folder <folder>', 'Project folder', process.env.PROJECT_FOLDER)
    .option('-k, --key <key>', 'Test build rocks key', process.env.TEST_BUILD_ROCKS_KEY)
    .option('-s, --slack-hook <hook>', 'Slack Hook', process.env.SLACK_HOOK)
    .option('-c, --slack-channel <channel>', 'Slack Channel', process.env.SLACK_CHANNEL)
    .parse(process.argv);

const projectId = program.projectId,
    projectFolder = project.projectFolder,
    message = child_process.execSync('git log --format=%B -n 1'),
    testBuildRocksKey = program.key,
    slackHook = program.slackHook,
    slackChannel = program.slackChannel;

winston.info('Uploading build');

let data = new FormData();
data.append('app', fs.createReadStream(`${projectFolder}/app/build/outputs/apk/app-release.apk`));
data.append('comment', message);
data.append('ci', 'true');

var result = fetch(`https://testbuild.rocks/api/builds/upload/${projectId}/android`, {
    method: 'POST',
    body: data,
    headers: {
        'X-API-Key': testBuildRocksKey
    }
})
    .then(res => {
        if (res.status == 200) {
            return res;
        }
        throw res;
    });
if (slackHook) {
    result = result.then(slack(slackHook, slackChannel));
}
result.catch(err => {
    winston.error('Error uploading build', {err});
});