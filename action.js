const core = require("@actions/core");
const github = require("@actions/github");

const unsupportedEvent = name => name !== "pull_request" && name !== "push" ? true : false;
const getBase = name => data => name === "pull_request" ? data.pull_request.base.sha : data.before;
const getHead = name => data => name === "pull_request" ? data.pull_request.head.sha : data.after;

(async function(){
  try {
    const token = core.getInput("token");
    const repo = github.context.repo.repo;
    const owner = github.context.repo.owner;
    const event_name = github.context.eventName;
    const octokit = github.getOctokit(token, { required: true });
    
    if (unsupportedEvent(event_name)) throw `This event (${event_name}) is unsupported. Kiss Diff only supports PUSH and PR events.`;
  
    const base = getBase(event_name)(github.context.payload);
    const head = getHead(event_name)(github.context.payload);
    const response = await octokit.repos.compareCommits({ base, head, owner, repo });
    
    if (response.status !== 200) throw `The API request for this ${github.context.eventName} event returned ${response.status}, expected 200.`;
    if (response.data.status !== "ahead") throw `The head commit for this ${github.context.eventName} event is not ahead of the base commit.`;
    
    let file;
    const files = response.data.files; 
    const path = core.getInput("path");
    const target_name = path.split("/").pop();
    const regexp = new RegExp(target_name);
    
    files.some(_file => regexp.test(_file.filename) ? file = _file : false)
    
    if (!file) throw `None of the files in this commits diff tree match the provided file (${path}).`;
    
    console.log("file", file);
    
    core.setOutput("added", file.status === "added");
    core.setOutput("modified", file.status === "modified");
    core.setOutput("removed", file.status === "removed");
    core.setOutput("renamed", file.status === "renamed");
    core.setOutput("name", file.filename);
    return;
  } catch (error) {
    core.setFailed(error);
  }
})();
