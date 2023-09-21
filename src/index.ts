import * as core from '@actions/core'
import simpleGit, {SimpleGit, TagResult} from 'simple-git'
import semver from "semver/preload";

const TEMP_PUBLISH_PREFIX = "autoversion-tmp-publishing-"

async function autoversionSetup(nextVersion: string, git: SimpleGit) {
  const markerTag = `${TEMP_PUBLISH_PREFIX}${nextVersion}`;

  await git.raw(["tag", markerTag])
  await git.raw(["push", "origin", "tag", markerTag])

  core.debug(`autoversion setup complete with markerTag ${markerTag}`)
}

async function autoversionComplete(nextVersion: string, git: SimpleGit) {
  const version = semver.parse(nextVersion)
  if(version) {
    const versionBase = `${version.major}.${version.minor}`

    const tags = await git.tags()
    const markerTagPrefix = `${TEMP_PUBLISH_PREFIX}${versionBase}`;
    const tagsToDelete = tags.all.filter(t => t.startsWith(markerTagPrefix))

    await Promise.all(tagsToDelete.map(async (t) => {
      await git.raw(["tag", "-d", t])
      await git.raw(["push", "origin", "-d", t])
    }))
  }else {
    throw new Error(`nextVersion parameter must be a valid semver string. Current value: ${nextVersion}`)
  }
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const nextVersion: string = core.getInput('nextVersion')
    const cleanupMarkers: boolean = core.getInput('cleanupMarkers') === "true"

    core.debug(`nextVersion: ${nextVersion}`)
    core.debug(`cleanupMarkers: ${cleanupMarkers}`)

    const git = simpleGit();

    if (!cleanupMarkers) {
      await autoversionSetup(nextVersion, git)
    } else {
      await autoversionComplete(nextVersion, git)
    }

  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
