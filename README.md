[![github-action]](https://github.com/marketplace/actions/simple-diff)
&nbsp;
[![github-sponsor]](https://github.com/sponsors/mudlabs)


# Simple Diff
A super simple diff checker for your GitHub workflow..


Very simple, you provide the action with a `path` to a _file_ or _folder_, and it tells you if the file was `added`, `modified`, `removed`, or `renamed`. It will also output the items `name`, particularly usefull if it was just `renamed`.

## Table of Contents
- [Usage](#usage)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Example Case](#example-case)


## Usage
```yaml
- name: Simple Diff
  uses: mudlabs/simple-diff@v1.0.0
  with:
    path: path/to/file   
```

## Inputs
| Input | Description | Default |
| --- | :--- | --- |
| `path` | Specifies a path from _root_ to the file or folder you want to check. | |
| `strict` | Specifies the action should fail if the `path` is not in the commits diff tree. | `true` |

## Outputs
| Output | Type | Description |
| --- | --- | --- |
| `added` | boolean | Specifies the file or folder was just added. |
| `modified` | boolean | Specifies the file or folder was modified. |
| `removed` | boolean | Specifies the file or folder was removed. |
| `renamed` | boolean | Specifies the file or folder was renamed. |
| `name` | string | Specifies the name of the file or folder. |

## Example Case
You have a workflow that only runs on a push event to a file path. But you don't want it to run if the file was `removed` _(deleted)_.

```yaml
name: My File Workflow

on:
  push:
    paths:
      - path/to/my/file.ext

jobs:
  diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Simple Diff
        id: diff
        uses: mudlabs/simple-diff@v1.0.0
        with:
          path: path/to/my/file.ext
      - run: exit 1
        if: steps.diff.outputs.removed
  
  # Other jobs will run only if file.ext was NOT removed.
```

[github-action]: https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/mudlabs/shields.io.endpoint/badges/github-action.json
[github-sponsor]: https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/mudlabs/shields.io.endpoint/badges/github-sponsor.json
