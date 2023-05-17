import * as core from '@actions/core';
import * as github from '@actions/github';

import fetch from 'node-fetch';

const ECLIPSE_API_URL='https://api.eclipse.org'

const validEvents: string[] = ['pull_request']

export async function run() {
  try {
    core.info(`ECA-Action bot has started the process`)

    const {
      eventName,
      payload: {
        repository: repo,
        pull_request: pr
      }
    } = github.context

    if (validEvents.indexOf(eventName) < 0) {
      core.error(`Invalid event: ${eventName}`)
      return
    }

    if (repo === undefined) {
      core.error(`Undefined repo`)
      return
    }

    if (pr === undefined) {
      core.error(`Undefined pull request`)
      return
    }

    const token = core.getInput('repo-token');
    const client = github.getOctokit(token)

    core.info("Getting commits for PR " + pr.number)

    client.rest.repos.listCommits
    const commitsListed = await client.rest.pulls.listCommits({
      owner: repo.owner.login as string,
      repo: repo.name as string,
      pull_number: pr.number as number,
    })

    let commits: any[] = []
    for (const commit of commitsListed.data) {
      commits.push({
        author: {
          name: commit?.commit?.author?.name,
          mail: commit?.commit?.author?.email
        },
        committer: {
          name: commit?.commit?.committer?.name,
          mail: commit?.commit?.committer?.email
        },

        subject: commit?.commit.message,
        hash: commit?.sha,
        parents: commit?.parents.map(parent => parent.sha)
      })
    }

    let requestBody = {
      repoUrl: repo.html_url,
      provider: "github",
      commits: commits
    }

    core.info("requestBody: " + JSON.stringify(requestBody))

    let requestBodyJson = JSON.stringify(requestBody).replace(/[\n\r]+/g, '')

    const response = await fetch(ECLIPSE_API_URL + '/git/eca', {
      method: 'post',
      body: requestBodyJson,
      headers: {
        'Content-Type': 'application/json',
        'charset': 'utf-8'
      }
    });

    const data = await response.json();
    const text = await response.text();
    core.info(text)

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
