#!/bin/bash
# 루트의 모델 사진 → SkinImg/wear/*.webp (2026-10-01). 사용 : bash docs/tools/wear-photos.sh
# 가로 장면 : 2752x1536 → 1672x941 / 정사각 : 세로 전체를 정사각으로 (cx = 인물 가로 위치 비율) / 세로 카드 : 표지(1536x2304)를 3:4 로
cd "$(dirname "$0")/../.."
O=wear902_s2_260925195134_d_skin1_E/skin1/SkinImg/wear
p() { ls | grep -F "$1" | head -1; }
scene() { ffmpeg -v error -y -i "$(p "$2")" -vf "crop=ih*1672/941:ih,scale=$3" -c:v libwebp -quality 80 "$O/$1.webp"; }
sq()    { ffmpeg -v error -y -i "$(p "$2")" -vf "crop=ih:ih:max(0\,min(iw-ih\,iw*$3-ih/2)):0,scale=1254:1254" -c:v libwebp -quality 80 "$O/$1.webp"; }
sqv()   { ffmpeg -v error -y -i "$(p "$2")" -vf "crop=iw:iw:0:(ih-iw)*$3,scale=1254:1254" -c:v libwebp -quality 80 "$O/$1.webp"; }
card()  { ffmpeg -v error -y -i "$(p "$2")" -vf "crop=iw:iw*4/3:0:(ih-iw*4/3)*0.4,scale=$3" -c:v libwebp -quality 80 "$O/$1.webp"; }
scene hero-wear902-poster cobblestone 1920:1080
scene scene-rack    monochromatic 1672:941
scene scene-coat    urban_wear 1672:941
scene scene-atelier posing_in_studio 1672:941
scene scene-dress   silk_dress 1672:941
scene scene-knit    subtle_makeup 1672:941
scene scene-denim   modern_street 1672:941
scene scene-blouse  sunglasses 1672:941
scene scene-closet  glass_buil…_2K_20261001231657 1672:941
scene scene-linen   linen_on_deck 1672:941
scene scene-trench  crosswalk 1672:941
scene scene-skirt   yellow_dress 1672:941
scene scene-bag     glass_buil…_2K_20261001225741 1672:941
scene scene-cardigan sitting_in_cafe 1672:941
scene scene-gift    red_lips 1672:941
sq sq-coat     urban_wear 0.5
sq sq-knit     subtle_makeup 0.58
sq sq-blouse   sunglasses 0.5
sq sq-skirt    yellow_dress 0.42
sq sq-bag      glass_buil…_2K_20261001225741 0.62
sq sq-cardigan sitting_in_cafe 0.5
sq sq-denim    modern_street 0.49
sq sq-shoes    oversized_blazer 0.49
sq sq-trench   crosswalk 0.5
sq sq-scarf    red_lips 0.5
sqv sq-dress   botanical_soft 0.25
sqv sq-atelier sculptural_white 0.2
card card-outer       parisian_bw 1086:1448
card card-top         retro_70s 1086:1448
card portrait-atelier desert_surreal 1122:1402
card portrait-knit    aquatic_blue 1122:1402
