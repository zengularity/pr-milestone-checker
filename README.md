# pr-milestone-checker

> A GitHub App built with [Probot](https://github.com/probot/probot) that checks that all the pull requests are tagged with a GitHub milestone.

## Usage

When a pull request is created/updated, this application checks whether it is properly [milestoned](https://help.github.com/en/articles/about-milestones).

![Usage](./docs/img/usage.gif)

> By default status is only set when the milestone is/was missing.

## Setup

```sh
# Install dependencies
npm install

# Run typescript
npm run build

# Run the bot
npm start
```

[![CircleCI](https://circleci.com/gh/zengularity/probot-pr-milestone.svg?style=svg)](https://circleci.com/gh/zengularity/probot-pr-milestone)

## Contributing

If you have suggestions for how this application could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2019 Zengularity (https://github.com/zengularity/probot-pr-milestone)
