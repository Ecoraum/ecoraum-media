#!/usr/bin/env bash
# v4 with the founders' voice: finalize4v.sh <video> <vo_dir>  (vo_dir holds <video>.vo.json + <video>-<n>.wav from voice_in.py)
set -euo pipefail
S=/tmp/claude-0/-home-user/287e9b8d-0272-595e-b02b-ba51e42335a3/scratchpad
name=$1; VO=$2; R=$S/v4/render; O=${OUT_DIR:-$S/v4/final-voice}
mkdir -p "$O"
python3 -I - "$R/$name.meta.json" "$VO/$name.vo.json" "$R/$name.voice.meta.json" <<'PY'
import json, sys
meta = json.load(open(sys.argv[1])); vo = json.load(open(sys.argv[2]))
meta["vo"] = [{"id": v["id"], "start": v["start"], "dur": v["dur"]} for v in vo]
json.dump(meta, open(sys.argv[3], "w"), indent=1)
PY
python3 -I "$S/mix3.py" "$R/$name.voice.meta.json" "$S/v4/song_short.wav" "$VO" "$R/$name.voice.wav" "" >/dev/null
m=$(ffmpeg -hide_banner -i "$R/$name.voice.wav" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
read -r I TP LRA TH OFF < <(echo "$m" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -v error -y -i "$R/$name.video.mp4" -i "$R/$name.voice.wav" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true,aresample=44100" \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$O/$name.mp4"
echo "$name (mit Stimme): $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$O/$name.mp4")s $(ffmpeg -hide_banner -i "$O/$name.mp4" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tr -s ' ')"
