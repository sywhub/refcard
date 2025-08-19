#!/bin/bash -e
files=()
while IFS= read -r line; do
	files+=("$line")
done < <(
	grep -oE '<script[^>]+src="[^"]+"' index.html | sed -E 's/.*src="([^"]+)".*/\1/'
	grep -oE '<link[^>]+rel="stylesheet"[^>]+href="[^"]+"' index.html | sed -E 's/.*href="([^"]+)".*/\1/'
)
stmp=$(mktemp -p . -t sed)
for f in "${files[@]}"; do
	echo "$f" >> "$stmp"
done
data=$(sed -n -e '/data/p' "$stmp")
prog="index.html $(sed -n -e '/data/!p' "$stmp")"
rm "$stmp"
tmp=`mktemp -p . -t ftp`
echo "cd js/refcard3" > $tmp
echo "rm data/*" >> $tmp
echo "rmdir data" >> $tmp
echo "rm *" >> $tmp
echo "mkdir data" >> $tmp
echo "cd data" >> $tmp
for f in ${data}
do
echo "put $f" >> $tmp
done
echo "cd .." >> $tmp
for f in ${prog}
do
echo "put $f" >> $tmp
done
for f in ${prog} ${data}
do
echo "chmod 0644" $f >> $tmp
done
sftp -p -b $tmp -N u47659892@ftp.nomadicminds.org 
rm $tmp
