# Auto Version

GitHub action to creat a new patch version from:

* A base version consisting of a major and minor value, conforming to the Semantic Versioning convention. Ex. `2.5`.
* The git repo tags. This action assumes full, proper SemVer strings in tags mark versions.

The "Auto Version" action will look for git tags that match the `versionBase` value, find the highest value, and provide the output `nextVersion` as the next automated SemVer string value.

Example:

```yaml
      - uses: touchlab/autoversion@main
        id: autoversion
        with:
          versionBase: 2.5

      - name: Print Next Version
        id: outputversion
        run: echo "${{ steps.autoversion.outputs.nextVersion }}"
```

If the repo had the following tags:

```
2.5.0
2.5.1
2.5.2
```

The resulting value would be `2.5.3`.

Changing the `versionBase` resets the autoversion patch number. If we changed the config to the following:

```yaml
      - uses: touchlab/autoversion@main
        id: autoversion
        with:
          versionBase: 2.6
```

The immediate next value would be `2.6.0`.

This action assumes you're applying git tags for versions.