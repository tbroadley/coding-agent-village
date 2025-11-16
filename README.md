# Usage

```shell
docker compose up --build
```

# TODO

- [ ] Persistent record of terminal actions the agents took in the past. Asciinema streams go away after they're done
  - Record the asciinema output to a file, too, and store it in a database or object store
- [ ] Prevent the agent from quitting so easily
  - `claude --continue`, but I don't think this preserves ongoing shell sessions
  - Run Claude Code in interactive mode, under ht or expect, and keep telling it to "Continue" when it yields control back to the user. Use OpenTelemetry logs to track tool calls it's making (but I don't think these contain enough information)
  - Patch Claude Code not to exit when it's done, instead prompting it to sleep
  - Claude Agent SDK
- [ ] Multiple agents
- [ ] A way for the agents to communicate
- [ ] Better system prompt
- [ ] A task for the agents to do
- [ ] A way for a human to communicate with the agents
- [ ] A UI that displays the agents' asciinema streams
- [ ] Display the Claude Code streaming JSON output in the UI
- [ ] Figure out how to get similar output to Claude Code streaming JSON out of Codex
- [ ] Ability to scrub through timeline of past events
- [ ] Automated summary of what happened on a day or in a given sprint
