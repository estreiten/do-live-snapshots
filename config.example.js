module.exports = {
  token: 'DigitalOcean_secret_token',
  logFile: 'logs.txt',
  droplet: 'Droplet_name',
  waitTime: 15,
  delete: { // false if no deletion is required
    maxCount: 2
  }
}