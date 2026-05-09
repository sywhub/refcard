#!/bin/bash
echo "====> Inventory contents"
files=()
while IFS= read -r line; do
	files+=("$line")
done < <(
	grep -oE '<script[^>]+src="[^"]+"' index.html | sed -E 's/.*src="([^"]+)".*/\1/'
	grep -oE '<link[^>]+rel="stylesheet"[^>]+href="[^"]+"' index.html | sed -E 's/.*href="([^"]+)".*/\1/'
	grep -oE '<script[^>]+src="[^"]+"' simulator.html | sed -E 's/.*src="([^"]+)".*/\1/'
	grep -oE '<link[^>]+rel="stylesheet"[^>]+href="[^"]+"' simulator.html | sed -E 's/.*href="([^"]+)".*/\1/'
)
all=`echo ${files[@]} | tr ' ' '\n' | sort -u | tr '\n' ' '`
echo "====> Packaging..."
tartmp=$(mktemp -p . -t tar)
sshtmp=$(mktemp -p . -t ssh)
tar -cvf $tartmp simulator.html index.html ${all[@]}
echo "Clean up remote"
ssh u47659892@ftp.nomadicminds.org  << 'SSHEND'
cd js/refcard3
rm -rf *
SSHEND
echo "====> Copy package file"
scp $tartmp u47659892@ftp.nomadicminds.org:js/refcard3  
echo cd js/refcard3 > $sshtmp
echo tar xvf $tartmp >> $sshtmp
echo rm -f $tartmp >> $sshtmp
echo "====> Extracting and cleanup..."
cat $sshtmp
ssh u47659892@ftp.nomadicminds.org  < $sshtmp
echo "====> Cleanup local"
rm -f $tartmp
rm -f $sshtmp
