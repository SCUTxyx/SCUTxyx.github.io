#!/usr/bin/env bash
# One-command local preview: build the site and serve it at http://localhost:4000
# Usage: ./serve.sh
set -e
cd "$(dirname "$0")"

export PATH="/opt/homebrew/opt/ruby/bin:/opt/homebrew/lib/ruby/gems/4.0.0/bin:$PATH"
export JEKYLL_NO_BUNDLER_REQUIRE=true

echo "🌸 Building site…"
jekyll build --config _config.yml,_config_local.yml --destination _site

echo ""
echo "✅ Preview ready → http://localhost:4000  (Ctrl+C to stop)"
echo ""
cd _site
python3 -m http.server 4000
