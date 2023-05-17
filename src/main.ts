import * as core from '@actions/core';
import * as github from '@actions/github';

import fetch from 'node-fetch';

const ECLIPSE_API_URL='https://api.eclipse.org'

const validEvents: string[] = ['pull_request']

export async function run() {
  try {
    core.info(`ECA-Action bot has started the process`)

    const token = core.getInput('repo-token', { required: true });

    const { context } = github
    const ownership = {
      owner: context.repo.owner,
      repo: context.repo.repo,
    }

    const eventName = context.eventName
    if (validEvents.indexOf(eventName) < 0) {
      core.error(`Invalid event: ${eventName}`)
      return
    }

    const { payload: { repository: repo, pull_request: pr} } = github.context

    if (repo === undefined) {
      core.error(`Undefined repo`)
      return
    }

    if (pr === undefined) {
      core.error(`Undefined pull request`)
      return
    }


    core.info("Getting commits for PR " + pr.number)

    const octokit = github.getOctokit(token)
    octokit.rest.repos.listCommits
    const commitsListed = await octokit.rest.pulls.listCommits({
      ...ownership,
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

    //const data = await response.json();
    const text = await response.text();
    core.info(text)

    for (let commit of requestBody.commits) {
      octokit.rest.repos.createCommitStatus({
        ...ownership,
        sha: commit.hash,
        state: "success",
        context: "eca-validation"
      })
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
