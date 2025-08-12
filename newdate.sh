#!/bin/bash
rm -f data/deploydate.data
echo "// Generated, do not edit" > data/deploydate.data
echo -n 'var DeployDate = new Date("' >> data/deploydate.data
date '+%B %d, %Y");' >> data/deploydate.data
echo -n 'var LatestGitTag = "' >> data/deploydate.data
git tag | tail -1 | sed -e 's/$/\";/'  >> data/deploydate.data
echo "" >> data/deploydate.data
