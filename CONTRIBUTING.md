# Contributing code
This guide gives you an overview on how to contribute code to the Gaia-X Compliance project.
To get started with the project, check our README.

## Branch structure explained
- development: 
	- this is the current branch used for development, and it's considered unstable;
	- branch out from here for Merge Requests;
- main: 
	- this is the current stable branch, which is used as a baseline for new releases;
	- the development branch is periodically merged into main, after it is confirmed that the software is stable
- 2206-unreleased:
	- implementation of the Trust Framework 2206 - release candidate;
	- only critical fixes will be backported to this branch;
	- this branch will stop being updated after 2210 is released;
- 2204:
	- implementation of the Trust Framework 2204;
        - no fixes will be backported to this branch;
- various feature/fix branches:
	- these are branches for work in progress items
	- they are temporary and will be deleted after the Merge Request is pushed to development branch
	

## How to make changes

### Clone the repository
```bash
git clone git@gitlab.com:gaia-x/lab/compliance/gx-compliance.git
```

### Create a new branch for the feature/fix that you would like to propose
The name of the branch should be a short description of the change.
It is recommended to add prefixed by `feat/`, `fix/`, `docs/` for easy readability.

**Always use the development branch as the baseline for any changes**
```bash
cd gx-compliance
git checkout development
git checkout -b <new_branch_name>
```

### Make your changes, and create a new commit
For each commit, make sure the commit message contains:
- what is the problem solved (if there is a gitlab issue or Jira, also link those)
- what was the root cause
- how are the changes done fixing the issue
- the `Signed-off-by:` line at the end of the commit message

```bash
git commit -s
```

An example of template you can use for the commit message can be found below:
```bash
Title

Description: <describe the purpose of the commit>
Root cause: <if this is a fix, add the root cause to the problem>
Solution: <describe how your changes fix the issue/why you chose this solution for the implementation>
Fixes: Jira nr/ gitlab issue/ previous commmit sha
Signed-off-by: <name@email>
```

### Push the new branch in the repo
```bash
git push origin <new_branch_name>
```

### Create the Merge Request
You can use the web interface using the link from the output of the previous
command, or from the branches list in the
[repo](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/branches).

**Make sure the destination branch for the MR is the development branch**
**Make sure you select the "Delete the source branch when Merge Request is
accepted." option before creating the MR**

Your MR will be reviewed by the maintainers of the repo. We may ask you to adjust
the content of the MR before it can be merged. Please make sure all the comments
in the MR are addressed. If merge conflicts occur, please use this
[guide](https://docs.gitlab.com/ee/user/project/merge_requests/conflicts.html)
to address them.

**Thank you for your contribution!**
