import * as core from '@actions/core';
import * as github from '@actions/github';

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
          name: commit?.author?.name,
          mail: commit?.author?.email
        },
        committer: {
          name: commit?.committer?.name,
          mail: commit?.committer?.email
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

    // import fetch from 'node-fetch';
    //
    // const body = {a: 1};
    //
    // const response = await fetch('https://httpbin.org/post', {
    //   method: 'post',
    //   body: JSON.stringify(body),
    //   headers: {'Content-Type': 'application/json'}
    // });
    // const data = await response.json();
    //
    // console.log(data);


  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
