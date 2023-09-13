import * as core from '@actions/core'
import simpleGit from 'simple-git'
import semver from 'semver/preload'

const TEMP_PUBLISH_PREFIX = "autoversion-tmp-publishing-"

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const versionBase: string = core.getInput('versionBase')

    core.debug(`versionBase: ${versionBase}`)

    const git = simpleGit();
    const tags = await git.tags()
    const versionBaseCompare = `${versionBase}.`
    core.debug('----------tags----------')
    tags.all.forEach(t => core.debug(t))
    core.debug('----------tags----------')
    const matching = tags.all
        .map(t => t.startsWith(TEMP_PUBLISH_PREFIX) ? t.substring(TEMP_PUBLISH_PREFIX.length) : t)
        .filter(t => t.startsWith(versionBaseCompare))
        .map(t => semver.parse(t))
        .filter(ver => ver !== null && ver !== undefined)

    const sorted = matching.sort((v1, v2) => v2!.compare(v1!))
    const nextPatch = sorted.length > 0 ? sorted[0]!.patch + 1 : 0
    const nextVersion = `${versionBase}.${nextPatch}`

    // Set outputs for other workflow steps to use
    core.setOutput('nextVersion', nextVersion)

    const markerTag = `${TEMP_PUBLISH_PREFIX}${nextVersion}`;
    await git.raw(["tag", markerTag])
    await git.push(["push", "origin", "tag", markerTag])
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
