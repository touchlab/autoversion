import * as core from '@actions/core'
import simpleGit, {SimpleGit, TagResult} from 'simple-git'
import semver from 'semver/preload'

const TEMP_PUBLISH_PREFIX = "autoversion-tmp-publishing-"

async function autoversionSetup(tags: TagResult, versionBase: string, git: SimpleGit) {
  const versionBaseCompare = `${versionBase}.`
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

  const branchName = `build-${nextVersion}`;
  await git.checkoutLocalBranch(branchName)

  const markerTag = `${TEMP_PUBLISH_PREFIX}${nextVersion}`;

  await git.raw(["tag", markerTag])
  await git.raw(["push", "origin", "tag", markerTag])

  core.debug(`autoversion setup complete with markerTag ${markerTag}`)

  return branchName
}

async function autoversionComplete(git: SimpleGit, versionBase: string, finalizeBuildVersion: string, branchName: string, tags: TagResult) {
  await git.add("./Package.swift")
  await git.commit(`KMM SPM package release for ${finalizeBuildVersion}`)
  await git.addAnnotatedTag(finalizeBuildVersion, `KMM release version ${finalizeBuildVersion}`)
  await git.raw("push", "origin", "-u", branchName, "--follow-tags")
  // await git.raw("push", "--follow-tags")

  const markerTagPrefix = `${TEMP_PUBLISH_PREFIX}${versionBase}`;
  const tagsToDelete = tags.all.filter(t => t.startsWith(markerTagPrefix))

  await Promise.all(tagsToDelete.map(async (t) => {
    await git.raw(["tag", "-d", t])
    await git.raw(["push", "origin", "-d", t])
  }))
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const versionBase: string = core.getInput('versionBase')
    const finalizeBuildVersion: string = core.getInput('finalizeBuildVersion')

    core.debug(`versionBase: ${versionBase}`)
    core.debug(`finalizeBuildVersion: ${finalizeBuildVersion}`)

    const git = simpleGit();
    const tags = await git.tags()

    core.debug('----------tags----------')
    tags.all.forEach(t => core.debug(t))
    core.debug('----------tags----------')

    let branchName = ''

    if (finalizeBuildVersion === '') {
      branchName = await autoversionSetup(tags, versionBase, git)
    } else {
      await autoversionComplete(git, versionBase, finalizeBuildVersion, branchName, tags)
    }

  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
