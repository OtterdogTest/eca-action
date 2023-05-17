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

    const token = process.env.GITHUB_TOKEN
    if (token === undefined || token.trim() === "") {
      core.error(`No token available`)
      return
    }

    const client = github.getOctokit(process.env.GITHUB_TOKEN as string)

    const commitsListed = await client.rest.pulls.listCommits({
      owner: repo?.owner.login as string,
      repo: repo?.name as string,
      pull_number: pr?.number as number,
    })

    let commits = commitsListed.data

    core.setOutput('commits', JSON.stringify(commits))

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
