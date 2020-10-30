const fs = require("fs");
const yaml = require("js-yaml");
const core = require("@actions/core");
const minimatch = require("minimatch");
const github = require("@actions/github");

const unsupportedEvent = name => name !== "pull_request" && name !== "push" ? true : false;
const getBase = name => data => name === "pull_request" ? data.pull_request.base.sha : data.before;
const getHead = name => data => name === "pull_request" ? data.pull_request.head.sha : data.after;
const normalise = path => path.split("/").filter(item => item !== "" && item !== ".").join("/");
const toBoolean = value => value.toLowerCase() == "true";


const setFromPath = octokit => owner => async repo => {
  try {
    const input_path = core.getInput("path");
    if (input_path) return normalise(input_path);
    
    console.warn("No path provided. Attempting to discern a path from the workflow file.");
    
    const event_name = github.context.eventName;
    const workflows = await octokit.request("GET /repos/:owner/:repo/actions/workflows", { owner, repo });
    const workflow = workflows.data.workflows.find(workflow => workflow.name === process.env.GITHUB_WORKFLOW);
    const file = await fs.promises.readFile(workflow.path);
    const data = yaml.safeLoad(file);
    const path = data.on[event_name] && data.on[event_name].paths ? data.on[event_name].paths[0] : undefined;
    
    if (!path) throw new Error(`No path specified within the workflow file for this (${event_name}) event.`);
    
    console.log(`Using the specified path (${path}), for this ${event_name} event`);
    return normalise(path);
  } catch(error) {
    console.error(error.message);
    return undefined;
  }
}

const contentsUrlDoesMatch = file => target => {
  const contents_url = decodeURIComponent(file.contents_url);
  const contents_path = contents_url.substring(contents_url.indexOf("contents/"), contents_url.indexOf("?ref="));
  const doesMatch = minimatch(contents_path, `contents/${target}`);
  console.log(contents_path, `contents/${target}`, doesMatch);
  return doesMatch;
};

(async function(){
  try {
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
    
    const target = await setFromPath(octokit)(owner)(repo);
    const files = response.data.files;
    const file = files.find(file => contentsUrlDoesMatch(file)(target));
//     decodeURIComponent(file.contents_url).indexOf(`contents/${target}`) !== -1);
    
    core.setOutput("name", file ? file.filename : target);
    core.setOutput("added", file ? file.status === "added" : false);
    core.setOutput("removed", file ? file.status === "removed" : false);
    core.setOutput("renamed", file ? file.status === "renamed" : false);
    core.setOutput("modified", file ? file.status === "modified" : false);
    core.setOutput("previous", file ? file.previous_filename || file.filename : target);
    
    if (file) return;
    if (strict) throw `None of the files in this commits diff tree match the provided file (${target}).`;
    console.log(`None of the files in this commits diff tree match the provided file (${target}).`);
           
  } catch (error) {
    core.setFailed(error);
  }
})();
