import * as core from '@actions/core'
import simpleGit from 'simple-git'
import semver from 'semver/preload'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const versionBase: string = core.getInput('versionBase')

    core.debug(`versionBase: ${versionBase}`)

    const tags = await simpleGit().tags()
    const versionBaseCompare = `${versionBase}.`
    core.debug("----------tags----------")
    tags.all.forEach((t)=>core.debug(t))
    core.debug("----------tags----------")
    const matching = tags.all
      .filter(t => t.startsWith(versionBaseCompare))
      .map(t => semver.parse(t))
      .filter(ver => ver !== null && ver !== undefined)

    const sorted = matching.sort((v1, v2) => v2!.compare(v1!))
    const nextPatch = sorted.length > 0 ? sorted[0]!.patch + 1 : 0
    const nextVersion = `${versionBase}.${nextPatch}`

    // Set outputs for other workflow steps to use
    core.setOutput('nextVersion', nextVersion)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
