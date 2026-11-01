#!/usr/bin/env bash
# Mix audio for each v3 reel, normalize to -14 LUFS (two-pass), mux with the rendered video.
set -euo pipefail
S=/tmp/claude-0/-home-user/287e9b8d-0272-595e-b02b-ba51e42335a3/scratchpad
R=$S/v3/render
O=$S/v3/final
mkdir -p "$O"
declare -A SILENT=([heizung]="heiz-6" [notfall]="not-6" [frage]="" [gruender]="" [vision]="")
for name in "$@"; do
  python3 -I "$S/mix3.py" "$R/$name.meta.json" "$S/v3/song_bed.wav" "$S/vo3" "$R/$name.wav" "${SILENT[$name]}"
  m=$(ffmpeg -hide_banner -i "$R/$name.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  read -r I TP LRA TH OFF < <(echo "$m" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
  ffmpeg -v error -y -i "$R/$name.video.mp4" -i "$R/$name.wav" -map 0:v -map 1:a -c:v copy \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true,aresample=44100" \
    -c:a aac -b:a 192k -shortest -movflags +faststart "$O/$name.mp4"
  echo "$name: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$O/$name.mp4")s, $(ffmpeg -hide_banner -i "$O/$name.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+I:' | tr -s ' ')"
done
