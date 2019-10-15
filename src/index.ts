import { Application, Context } from 'probot' // eslint-disable-line no-unused-vars

import * as t from 'io-ts'
import { none, some, Option } from 'fp-ts/lib/Option'
import { either } from 'fp-ts'

// Model from validators
const StatusContext = 'milestone-checker'

const MilestoneInfo = t.exact(
  t.type({
    id: t.number,
    html_url: t.string,
    state: t.string,
    title: t.string,
  }),
)

type IMilestoneInfo = t.TypeOf<typeof MilestoneInfo>

const BranchInfo = t.exact(
  t.type({
    sha: t.string,
  }),
)

const PullRequestInfo = t.exact(
  t.type({
    id: t.number,
    milestone: t.union([MilestoneInfo, t.undefined, t.null]),
    head: BranchInfo,
  }),
)

type IPullRequestInfo = t.TypeOf<typeof PullRequestInfo>

const IssueInfo = t.exact(
  t.type({
    id: t.number,
    number: t.number,
    pull_request: t.union([t.any, t.undefined, t.null]),
  }),
)

type CommitState = 'success' | 'error' | 'failure' | 'pending'

// Webhook handlers

export = (app: Application) => {
  app.on('issues.milestoned', async context => {
    const issue = context.payload.issue
    const event = await fromEither(IssueInfo.decode(issue))

    if (!event.pull_request) {
      context.log(`Not a pull request issue: #${event.id}`)
    } else {
      const resp = await context.github.pulls.get(
        context.repo({
          number: issue.number,
        }),
      )
      const pr: IPullRequestInfo = await fromEither(PullRequestInfo.decode(resp.data))

      if (pr.milestone) {
        await milestoned(context, pr, pr.milestone)
      }
    }
  })

  app.on('issues.demilestoned', async context => {
    const issue = context.payload.issue
    const event = await fromEither(IssueInfo.decode(issue))

    if (!event.pull_request) {
      context.log(`Not a pull request issue: #${event.id}`)
    } else {
      const resp = await context.github.pulls.get(
        context.repo({
          number: issue.number,
        }),
      )
      const pr: IPullRequestInfo = await fromEither(PullRequestInfo.decode(resp.data))

      await demilestoned(context, pr)
    }
  })

  app.on(['pull_request.opened', 'pull_request.edited', 'pull_request.synchronize'], async context => {
    const pull_request = context.payload.pull_request
    const pr: IPullRequestInfo = await fromEither(PullRequestInfo.decode(pull_request))

    context.log(`Checking milestone for pull request #${pr.id}`, pr.milestone)

    if (!pr.milestone) {
      return await demilestoned(context, pr)
    } else {
      return await milestoned(context, pr, pr.milestone)
    }
  })
}

function milestoned(bot: Context, pr: IPullRequestInfo, milestone: IMilestoneInfo): Promise<void> {
  const msg = `Milestone set to ${milestone.title}`

  bot.log(`${msg} for pull request #${pr.id}`)

  return toggleState(
    bot,
    pr.head.sha,
    'success',
    msg,
    some(milestone.html_url),
    current => current.exists(s => s != 'success'), // TODO: Config to always set, default: false
  )
}

function demilestoned(bot: Context, pr: IPullRequestInfo): Promise<void> {
  const msg = 'No milestone set'

  bot.log(`${msg} for pull request #${pr.id}`)

  return toggleState(bot, pr.head.sha, 'error', msg, none, current => !current.exists(s => s == 'error'))
}

function toggleState(
  bot: Context,
  sha: string,
  expectedState: CommitState,
  msg: string,
  url: Option<string>,
  mustSet: (s: Option<string>) => boolean,
): Promise<void> {
  return getCommitState(bot, sha, StatusContext).then(state => {
    if (!mustSet(state)) {
      return Promise.resolve()
    } else {
      return bot.github.repos
        .createStatus(
          bot.repo({
            sha: sha,
            context: StatusContext,
            state: expectedState,
            description: msg,
            target_url: url.toUndefined(),
          }),
        )
        .then(_r => Promise.resolve())
    }
  })
}

function getCommitState(bot: Context, ref: string, ctx: string): Promise<Option<string>> {
  return bot.github.repos.listStatusesForRef(bot.repo({ ref })).then(resp => {
    const found = resp.data.find(s => s.context == ctx)

    if (!found) {
      return Promise.resolve(none)
    } else {
      return Promise.resolve(some(found.state))
    }
  })
}

// IO-TS utility

function fromEither<T>(e: either.Either<t.Errors, T>): Promise<T> {
  return e.fold(cause => Promise.reject(new Error(JSON.stringify(cause))), res => Promise.resolve(res))
}
