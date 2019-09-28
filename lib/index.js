"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var t = __importStar(require("io-ts"));
var Option_1 = require("fp-ts/lib/Option");
// Model from validators
var StatusContext = 'milestone-checker';
var MilestoneInfo = t.exact(t.type({
    id: t.number,
    html_url: t.string,
    state: t.string,
    title: t.string,
}));
var BranchInfo = t.exact(t.type({
    sha: t.string,
}));
var PullRequestInfo = t.exact(t.type({
    id: t.number,
    milestone: t.union([MilestoneInfo, t.undefined, t.null]),
    head: BranchInfo,
}));
var IssueInfo = t.exact(t.type({
    id: t.number,
    number: t.number,
    pull_request: t.union([t.any, t.undefined, t.null]),
}));
function milestoned(bot, pr, milestone) {
    var msg = "Milestone set to " + milestone.title;
    bot.log(msg + " for pull request #" + pr.id);
    return toggleState(bot, pr.head.sha, 'success', msg, Option_1.some(milestone.html_url), function (current) { return current.exists(function (s) { return s != 'success'; }); });
}
function demilestoned(bot, pr) {
    var msg = 'No milestone set';
    bot.log(msg + " for pull request #" + pr.id);
    return toggleState(bot, pr.head.sha, 'error', msg, Option_1.none, function (current) { return !current.exists(function (s) { return s == 'error'; }); });
}
function toggleState(bot, sha, expectedState, msg, url, mustSet) {
    return getCommitState(bot, sha, StatusContext).then(function (state) {
        if (!mustSet(state)) {
            return Promise.resolve();
        }
        else {
            return bot.github.repos
                .createStatus(bot.repo({
                sha: sha,
                context: StatusContext,
                state: expectedState,
                description: msg,
                target_url: url.toUndefined(),
            }))
                .then(function (_r) { return Promise.resolve(); });
        }
    });
}
function getCommitState(bot, ref, ctx) {
    return bot.github.repos.listStatusesForRef(bot.repo({ ref: ref })).then(function (resp) {
        var found = resp.data.find(function (s) { return s.context == ctx; });
        if (!found) {
            return Promise.resolve(Option_1.none);
        }
        else {
            return Promise.resolve(Option_1.some(found.state));
        }
    });
}
// IO-TS utility
function fromEither(e) {
    return e.fold(function (cause) { return Promise.reject(new Error(JSON.stringify(cause))); }, function (res) { return Promise.resolve(res); });
}
module.exports = function (app) {
    app.on('issues.milestoned', function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var issue, event, resp, pr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    issue = context.payload.issue;
                    return [4 /*yield*/, fromEither(IssueInfo.decode(issue))];
                case 1:
                    event = _a.sent();
                    if (!!event.pull_request) return [3 /*break*/, 2];
                    context.log("Not a pull request issue: #" + event.id);
                    return [3 /*break*/, 6];
                case 2: return [4 /*yield*/, context.github.pullRequests.get(context.repo({
                        number: issue.number,
                    }))];
                case 3:
                    resp = _a.sent();
                    return [4 /*yield*/, fromEither(PullRequestInfo.decode(resp.data))];
                case 4:
                    pr = _a.sent();
                    if (!pr.milestone) return [3 /*break*/, 6];
                    return [4 /*yield*/, milestoned(context, pr, pr.milestone)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.on('issues.demilestoned', function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var issue, event, resp, pr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    issue = context.payload.issue;
                    return [4 /*yield*/, fromEither(IssueInfo.decode(issue))];
                case 1:
                    event = _a.sent();
                    if (!!event.pull_request) return [3 /*break*/, 2];
                    context.log("Not a pull request issue: #" + event.id);
                    return [3 /*break*/, 6];
                case 2: return [4 /*yield*/, context.github.pullRequests.get(context.repo({
                        number: issue.number,
                    }))];
                case 3:
                    resp = _a.sent();
                    return [4 /*yield*/, fromEither(PullRequestInfo.decode(resp.data))];
                case 4:
                    pr = _a.sent();
                    return [4 /*yield*/, demilestoned(context, pr)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    }); });
    app.on(['pull_request.opened', 'pull_request.edited', 'pull_request.synchronize'], function (context) { return __awaiter(void 0, void 0, void 0, function () {
        var pull_request, pr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pull_request = context.payload.pull_request;
                    return [4 /*yield*/, fromEither(PullRequestInfo.decode(pull_request))];
                case 1:
                    pr = _a.sent();
                    context.log("Checking milestone for pull request #" + pr.id, pr.milestone);
                    if (!!pr.milestone) return [3 /*break*/, 3];
                    return [4 /*yield*/, demilestoned(context, pr)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3: return [4 /*yield*/, milestoned(context, pr, pr.milestone)];
                case 4: return [2 /*return*/, _a.sent()];
            }
        });
    }); });
};
//# sourceMappingURL=index.js.map