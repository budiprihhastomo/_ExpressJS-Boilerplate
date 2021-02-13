const redis = require('redis')

const { REDIS_HOST, REDIS_PORT } = process.env

module.exports = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT })