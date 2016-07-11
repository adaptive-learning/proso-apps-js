# Deployment

## Versioning

### Release new patch (micro version)

`grunt release_patch`

### Push to bower without releasing

`grunt shell:bower`

### Start new version

crate new branch for current minor version and increase minor version in master

`grunt start_new_version`

## Typical Use Cases

### I want to fix a bug

1. do the code changes in your favorite IDE
2. commit the changes to master branch
3. checkout the master branch with your minor version (e.g., `master-2.1.X`) and pull the latest changes
4. cherry-pick created commits to the master branch with you minor version (e.g., `master-2.1.X`)
5. execute `grunt release_patch` and check it finished with success

### There is a strange error during releasing a patch

It can easily happen the release tag already exists in `proso-apps-js-bower`
repository. In this case you probably see something like this:

```
Running "shell:bower_release" (shell) task
fatal: tag '2.1.0' already exists
Warning: Command failed: fatal: tag '2.1.0' already exists
 Use --force to continue.
```

* If the tag corresponds to an ordinary release in the past, you probably did not
pull the latest changes to the master branch with the given minor version
(e.g., `master-2.1.X`).
* If the tag corresponds to the version you currently want to release, you
  probably made a mistake during the release. Please remove the tag from the
  origin in `proso-apps-js-bower` by calling `git push origin :TAG_NAME`. And
  try it again.
