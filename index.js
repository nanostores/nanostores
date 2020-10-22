let { createRouter, openPage, getPagePath } = require('./create-router')
let { subscribe } = require('./subscribe')
let { Model } = require('./model')
let { Store } = require('./store')

module.exports = {
  createRouter,
  getPagePath,
  subscribe,
  openPage,
  Model,
  Store
}
