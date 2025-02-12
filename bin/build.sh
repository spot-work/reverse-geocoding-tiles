#!/usr/bin/env bash

set -ex

DIR=$(pwd)

# 必要なディレクトリの作成
mkdir -p $DIR/tmp
mkdir -p $DIR/data

cd $DIR/tmp

# 2024年版の行政区域データをダウンロード
wget https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2024/N03-20240101_GML.zip -O ./data.zip

# データの解凍
unzip -o ./data.zip

# GeoJSONへの変換
# 注意: 2024年版のファイル名に合わせて変更
ogr2ogr -f GeoJSON -t_srs EPSG:4326 admins.json N03-20240101.shp

# プロパティの最適化（ストリーム処理を使用）
node ../bin/optimize-geojson.js

# ベクトルタイルの作成
# 注意: 入力ファイルを data/N03-optimized.geojson に変更
tippecanoe \
    --no-tile-compression \
    --maximum-zoom=10 \
    --minimum-zoom=8 \
    -l japanese-admins \
    -o admins.mbtiles \
    $DIR/data/N03-optimized.geojson \
    --force

# タイルの展開
# 注意: mb-utilは存在しないディレクトリを要求するため、一度削除して新規作成
rm -rf $DIR/docs/tiles
mkdir -p $DIR/docs
mb-util --image_format=pbf admins.mbtiles $DIR/docs/tiles

# 一時ファイルのクリーンアップ（オプション）
# rm -f ./data.zip
# rm -f ./admins.json
# rm -f ./admins.mbtiles