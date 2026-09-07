#!/usr/bin/env bash
#
# Turn raw drone/camera footage into the two-file set the site expects.
#
#   ./scripts/encode-web-video.sh DJI_0212.mp4 hub-drone-tour
#
# Produces, in public/:
#   <name>.mp4          1600x900, desktop
#   <name>-mobile.mp4    960x540, phones
#   <name>-poster.webp   first frame, used as the video poster
#
# Why these settings:
#   -an              drone audio is propeller noise, and muted autoplay is a
#                    browser requirement anyway. Dropping it saves ~200 KB.
#   hqdn3d           grass and foliage are the expensive part of the bitrate.
#                    A light denoise removes sensor noise the encoder would
#                    otherwise spend bits preserving — roughly halves the file.
#   -r 30            source is often 60-120 fps; 30 is plenty for a b-roll loop.
#   -crf 28/29       tuned by eye at the size these actually render.
#   +faststart       moves the moov atom to the front so playback can start on
#                    the first few hundred KB instead of a full download.
#
# H.264 only, deliberately: VP9/AV1 were measured on this footage and came out
# the same size or worse, and H.264 is hardware-decoded everywhere (kinder to
# phone batteries) with no fallback file to keep in sync.
#
set -euo pipefail

SRC="${1:?usage: encode-web-video.sh <source> <output-basename>}"
NAME="${2:?usage: encode-web-video.sh <source> <output-basename>}"
OUT="$(dirname "$0")/../public"
DENOISE="hqdn3d=3:2:4:4"

ffmpeg -y -i "$SRC" -an -c:v libx264 -profile:v high -level 4.0 \
  -preset veryslow -crf 29 -pix_fmt yuv420p -r 30 \
  -vf "${DENOISE},scale=1600:900:flags=lanczos" -g 60 \
  -movflags +faststart "$OUT/$NAME.mp4"

ffmpeg -y -i "$SRC" -an -c:v libx264 -profile:v main -level 3.1 \
  -preset veryslow -crf 28 -pix_fmt yuv420p -r 30 \
  -vf "${DENOISE},scale=960:540:flags=lanczos" -g 60 \
  -movflags +faststart "$OUT/$NAME-mobile.mp4"

ffmpeg -y -i "$OUT/$NAME.mp4" -frames:v 1 -vf scale=1024:576 \
  -c:v libwebp -quality 68 -compression_level 6 "$OUT/$NAME-poster.webp"

ls -lh "$OUT/$NAME.mp4" "$OUT/$NAME-mobile.mp4" "$OUT/$NAME-poster.webp"

# Files in public/ get a one-year immutable Cache-Control (see next.config.ts),
# so give a replacement clip a NEW filename rather than overwriting these.
