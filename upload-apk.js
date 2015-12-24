#!/usr/bin/env node
'use strict';

const fetch = require('node-fetch'),
    FormData = require('form-data'),
    fs = require('fs'),
    child_process = require('child_process'),
    winston = require('winston'),
    moment = require('moment');

const projectId = process.env.PROJECT_ID,
    projectFolder = process.env.PROJECT_FOLDER,
    message = child_process.execSync('git log --format=%B -n 1'),
    testBuildRocksKey = process.env.TEST_BUILD_ROCKS_KEY,
    slackHook = process.env.SLACK_HOOK,
    slackChannel = process.env.SLACK_CHANNEL;

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
    result = result
        .then(res => {
            return res.json()
        })
        .then(json => {
            return fetch(slackHook, {
                method: 'POST',
                body: JSON.stringify({
                    attachments: [
                        {
                            fallback: `Uploaded ${appName} to TestBuild.rocks`,
                            pretext: `Uploaded ${appName} to TestBuild.rocks`,
                            title: json.name,
                            title_link: json.install,
                            color: 'good',
                            fields: [
                                {
                                    title: 'Version',
                                    value: json.version,
                                    short: true
                                },
                                {
                                    title: 'Build#',
                                    value: json.build,
                                    short: true
                                },
                                {
                                    title: 'Platform',
                                    value: json.type,
                                    short: true
                                },
                                {
                                    title: 'Date',
                                    value: moment.unix(json.date).format('llll'),
                                    short: true
                                },
                                {
                                    title: 'Comment',
                                    value: json.comment
                                }
                            ],
                            image_url: json.qrcode,
                            thumb_url: json.iconurl
                        }
                    ],
                    channel: slackChannel
                })
            })
        })
        .then(res => {
            if (res.status == 200) {
                winston.info('Sent to Slack');
                return;
            }
            throw res;
        });
}
result.catch(err => {
    winston.error('Error uploading build', {err});
});
