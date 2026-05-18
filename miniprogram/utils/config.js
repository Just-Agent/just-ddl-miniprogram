const ENV = 'prod'

const ENV_CONFIG = {
  dev: {
    baseUrl: 'https://just-agent.github.io/just-ddl/',
    assetBaseUrl: 'https://just-agent.github.io/just-ddl/',
    timeout: 10000,
    cloudEnv: 'just-ddl-dev',
  },
  prod: {
    baseUrl: 'https://just-agent.github.io/just-ddl/',
    assetBaseUrl: 'https://just-agent.github.io/just-ddl/',
    timeout: 10000,
    cloudEnv: 'just-ddl-prod',
  },
}

export default { env: ENV, ...ENV_CONFIG[ENV] }
