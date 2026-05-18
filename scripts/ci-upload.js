const path = require('path')
const ci = require('miniprogram-ci')

const mode = process.argv[2] || 'preview'
const appid = process.env.WX_APPID || process.env.MINIPROGRAM_APPID
const privateKeyPath = process.env.WX_UPLOAD_PRIVATE_KEY_PATH || process.env.MINIPROGRAM_PRIVATE_KEY_PATH
const version = process.env.MINIPROGRAM_VERSION || process.env.GITHUB_REF_NAME || '0.1.0'
const desc = process.env.MINIPROGRAM_DESC || 'Just-DDL mini program upload'

if (!appid || !privateKeyPath) {
  throw new Error('WX_APPID and WX_UPLOAD_PRIVATE_KEY_PATH are required')
}

const project = new ci.Project({
  appid,
  type: 'miniProgram',
  projectPath: path.resolve(__dirname, '..'),
  privateKeyPath,
  ignores: ['node_modules/**/*', 'miniprogram_npm/**/*']
})

async function main() {
  if (mode === 'upload') {
    await ci.upload({ project, version, desc, setting: { es6: true, minify: true }, onProgressUpdate: console.log })
  } else {
    await ci.preview({ project, desc, setting: { es6: true, minify: true }, qrcodeFormat: 'terminal', onProgressUpdate: console.log })
  }
}
main().catch((error) => { console.error(error); process.exit(1) })
