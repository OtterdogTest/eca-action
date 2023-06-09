"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const ECLIPSE_API_URL = 'https://api.eclipse.org';
const validEvents = ['pull_request'];
function run() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.info(`ECA-Action bot has started the process`);
            const token = core.getInput('repo-token', { required: true });
            const { context } = github;
            const ownership = {
                owner: context.repo.owner,
                repo: context.repo.repo,
            };
            const eventName = context.eventName;
            if (validEvents.indexOf(eventName) < 0) {
                core.error(`Invalid event: ${eventName}`);
                return;
            }
            const { payload: { repository: repo, pull_request: pr } } = github.context;
            if (repo === undefined) {
                core.error(`Undefined repo`);
                return;
            }
            if (pr === undefined) {
                core.error(`Undefined pull request`);
                return;
            }
            core.info("Getting commits for PR " + pr.number);
            const octokit = github.getOctokit(token);
            octokit.rest.repos.listCommits;
            const commitsListed = yield octokit.rest.pulls.listCommits(Object.assign(Object.assign({}, ownership), { pull_number: pr.number }));
            let commits = [];
            for (const commit of commitsListed.data) {
                commits.push({
                    author: {
                        name: (_b = (_a = commit === null || commit === void 0 ? void 0 : commit.commit) === null || _a === void 0 ? void 0 : _a.author) === null || _b === void 0 ? void 0 : _b.name,
                        mail: (_d = (_c = commit === null || commit === void 0 ? void 0 : commit.commit) === null || _c === void 0 ? void 0 : _c.author) === null || _d === void 0 ? void 0 : _d.email
                    },
                    committer: {
                        name: (_f = (_e = commit === null || commit === void 0 ? void 0 : commit.commit) === null || _e === void 0 ? void 0 : _e.committer) === null || _f === void 0 ? void 0 : _f.name,
                        mail: (_h = (_g = commit === null || commit === void 0 ? void 0 : commit.commit) === null || _g === void 0 ? void 0 : _g.committer) === null || _h === void 0 ? void 0 : _h.email
                    },
                    subject: commit === null || commit === void 0 ? void 0 : commit.commit.message,
                    hash: commit === null || commit === void 0 ? void 0 : commit.sha,
                    parents: commit === null || commit === void 0 ? void 0 : commit.parents.map(parent => parent.sha)
                });
            }
            let requestBody = {
                repoUrl: repo.html_url,
                provider: "github",
                commits: commits
            };
            core.info("requestBody: " + JSON.stringify(requestBody));
            let requestBodyJson = JSON.stringify(requestBody).replace(/[\n\r]+/g, '');
            const response = yield (0, node_fetch_1.default)(ECLIPSE_API_URL + '/git/eca', {
                method: 'post',
                body: requestBodyJson,
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                }
            });
            //const data = await response.json();
            const text = yield response.text();
            core.info(text);
            for (let commit of requestBody.commits) {
                octokit.rest.repos.createCommitStatus(Object.assign(Object.assign({}, ownership), { sha: commit.hash, state: "success", context: "eca-validation" }));
            }
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
exports.run = run;
run();
