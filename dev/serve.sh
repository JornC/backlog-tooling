#!/usr/bin/env bash
set -e

# Change current directory to misc directory so it can be called from everywhere
SCRIPT_PATH=$(readlink -f "${0}")
SCRIPT_DIR=$(dirname "${SCRIPT_PATH}")

# Serve the entire project in a single tmux session. Has some dependencies on tools.

# Check if the necessary tools are installed
command -v tmux >/dev/null 2>&1 || { echo >&2 "I require tmux but it's not installed.  Aborting."; exit 1; }
command -v lsof >/dev/null 2>&1 || { echo >&2 "I require lsof but it's not installed.  Aborting."; exit 1; }

# Kill existing session of the same name, and sleep a while to let threads die. Do this before port checks.
tmux kill-session -t backlog-serve && { echo "Waiting for existing session to close"; sleep 2; }

# Check if 'lsof' is available, and if so do port checks
lsof -i:5173 2>&1 | grep "(LISTEN)" && { echo "Need port 5173 to be free. (perhaps another tmux session is hogging it? Try 'tmux kill-server'.)"; exit 1; }
lsof -i:8080 2>&1 | grep "(LISTEN)" && { echo "Need port 8080 to be free. (perhaps another tmux session is hogging it? Try 'tmux kill-server'.)"; exit 1; }

cd "${SCRIPT_DIR}/misc"

# Launch a tmux session
echo "Launching tmux session 'backlog-serve'"
tmux new-session -d -s backlog-serve ./frontend.sh --host
tmux select-pane -T "Frontend"

# Let panes remain on exit, so that any crashes remain visible
tmux set-option remain-on-exit

tmux split-window -v ./api.sh
tmux select-pane -T "API"

# Set the layout to 'tiled'
tmux select-layout tiled

# Attach to the session
tmux -2 attach-session -d

###
# Note for prosperity: Exit tmux through 'ctrl + b, d' by default
# A sample tmux config: (put it in the home directory in a file called `.tmux.conf`)
###
# # change default key to the tilde button (detach/exit through tilde > d)
# unbind C-b
# set -g prefix `
# bind-key ` send-prefix
#
# # restart a pane by [prefix]-r
# bind r respawn-pane -k
#
# # Enable mouse interaction
# set -g mouse on
#
# # Display pane names
# set -g pane-border-status top
# set -g pane-border-format "#[fg=black, bg=green] #{pane_index} #{pane_title}"
###
