#!/bin/bash
rm -f deploydate.js
echo "// Generated, do not edit" > deploydate.js
echo -n 'var DeployDate = new Date("' >> deploydate.js
date '+%B %d, %Y");' >> deploydate.js
echo -n 'var LatestGitTag = "' >> deploydate.js
git tag | tail -1 | sed -e 's/$/\";/'  >> deploydate.js
echo "" >> deploydate.js