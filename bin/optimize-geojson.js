const fs = require('fs')
const path = require('path')
const JSONStream = require('JSONStream')

try {
  // 入力ファイルのストリームを作成
  const inputStream = fs.createReadStream(
    path.join(__dirname, '../tmp/admins.json'),
    { encoding: 'utf8' },
  )

  // 出力ファイルのストリームを作成
  const outputStream = fs.createWriteStream(
    path.join(__dirname, '../data/N03-optimized.geojson'),
    { encoding: 'utf8' },
  )

  // GeoJSONヘッダーを書き込む
  outputStream.write('{"type":"FeatureCollection","features":[')

  let isFirst = true
  const parser = JSONStream.parse('features.*')

  parser.on('data', (feature) => {
    // プロパティの処理
    for (const [key, value] of Object.entries(feature.properties)) {
      if (
        value === null ||
        value === '所属未定地' ||
        String(value).endsWith('支庁')
      ) {
        feature.properties[key] = ''
      }
    }

    // IDとプロパティの設定
    feature.id = Number(feature.properties.N03_007)
    feature.properties = {
      prefecture: feature.properties.N03_001,
      city: `${feature.properties.N03_003}${feature.properties.N03_004}`,
    }

    // カンマの処理とfeatureの書き込み
    if (!isFirst) {
      outputStream.write(',')
    }
    isFirst = false
    outputStream.write(JSON.stringify(feature))
  })

  parser.on('end', () => {
    // GeoJSONフッターを書き込む
    outputStream.write(']}')
    outputStream.end()
    console.log('Processing completed successfully')
  })

  parser.on('error', (error) => {
    console.error('Error parsing JSON:', error)
    process.exit(1)
  })

  // パイプラインの設定
  inputStream.pipe(parser)
} catch (error) {
  console.error('Error setting up streams:', error)
  process.exit(1)
}
