#!/bin/bash
set -e

bash -i -c 'nvm install'

base_dir="apps"
declare -A commands
commands=(
    ["backend-api"]="bun install"
    ["backend-worker"]="bun install"
)

for dir in "${!commands[@]}"; do
    full_path="$base_dir/$dir"  # Construct the full path
    if [ -d "$full_path" ]; then
        cp ./tsconfig.base.json "$full_path/tsconfig.base.json"
        cd "$full_path" || exit  # Go to the directory, exit if it fails
        # Execute the command associated with the directory
        eval "${commands[$dir]}"
        cd - || exit  # Go back to the previous directory, exit if it fails
    fi
done