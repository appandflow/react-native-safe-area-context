#!/usr/bin/env bash
set -euo pipefail

if [[ "${RUNNER_OS:-}" == "Windows" ]]; then
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cmd //c "$(cygpath -w "$script_dir/build-android.cmd")"
else
  cd example/android
  ./gradlew assembleDebug
fi
