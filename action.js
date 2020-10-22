const core = require("@actions/core");
const github = require("@actions/github");

const unsupportedEvent = name => name !== "pull_request" && name !== "push" ? true : false;
const getBase = name => data => name === "pull_request" ? data.pull_request.base.sha : data.before;
const getHead = name => data => name === "pull_request" ? data.pull_request.head.sha : data.after;
const normalise = path => path.split("/").filter(item => item !== "" && item !== ".").join("/");
const toBoolean = value => value.toLowerCase() == "true";

(async function(){
  try {
    const path = core.getInput("path");
    const token = core.getInput("token");
    const repo = github.context.repo.repo;
    const owner = github.context.repo.owner;
    const event_name = github.context.eventName;
    const strict = toBoolean(core.getInput("strict"));
    const octokit = github.getOctokit(token, { required: true });

    if (unsupportedEvent(event_name)) throw `This event (${event_name}) is unsupported. Simple Diff only supports PUSH and PR events.`;
  
    const base = getBase(event_name)(github.context.payload);
    const head = getHead(event_name)(github.context.payload);
    const response = await octokit.repos.compareCommits({ base, head, owner, repo });
    
    if (response.status !== 200) throw `The API request for this ${github.context.eventName} event returned ${response.status}, expected 200.`;
    if (response.data.status !== "ahead") throw `The head commit for this ${github.context.eventName} event is not ahead of the base commit.`;
    
    const target = normalise(path);
    const files = response.data.files; 
    console.log("Target file", target);
    files.forEach(file => {
      console.log(file.contents_url);
      console.log(file.contents_url.indexOf(`contents/${target}`));
      const d = decodeURIComponent(file.contents_url);
      console.log(d);
      console.log(d.indexOf(`contents/${target}`));
    });
    const file = files.find(file => file.contents_url.indexOf(`contents/${target}`) !== -1);
    
    if (file) {
      core.setOutput("added", file.status === "added");
      core.setOutput("modified", file.status === "modified");
      core.setOutput("removed", file.status === "removed");
      core.setOutput("renamed", false.status === "renamed");
      core.setOutput("name", file.filename);
      return;
    }
    
    if (strict === true) throw `None of the files in this commits diff tree match the provided file (${path}).`;
    console.log(`None of the files in this commits diff tree match the provided file (${path}).`);
           
  } catch (error) {
    core.setFailed(error);
  }
})();
