#!/bin/bash
# renders up to 2 pending chunks, skipping finished ones
cd /home/user/cm-delivery/shorts
n=0
while read i a b; do
  grep -q "exit 0" out/grwm/part$i.log 2>/dev/null && continue
  [ $n -ge 2 ] && break
  out/grwm/chunk.sh $i $a $b; n=$((n+1))
  grep -q "exit 0" out/grwm/part$i.log || { echo "chunk $i failed"; exit 1; }
done <<L
1 0 403
2 404 807
3 808 1211
4 1212 1615
5 1616 2019
6 2020 2420
L
for i in 1 2 3 4 5 6; do grep -q "exit 0" out/grwm/part$i.log 2>/dev/null && echo "done $i"; done
exit 0
