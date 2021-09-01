const fs = require('fs');
const digitalocean = require('digitalocean');
const config = require('./config');
const waitTime = config.waitTime || 15;
const client = digitalocean.client(config.token);

const log = (txt) => {
  const today = new Date().toISOString()
  const logTxt = `${today} || ${txt}`
  console.log(logTxt)
  if (config.logFile) {
    fs.appendFileSync(config.logFile, logTxt)
  }
}

client.droplets.list().then(function (droplets) {
  return new Promise(async (resolve, reject) => {
    try {
      const droplet = droplets.find(droplet => droplet.name === config.droplet);
      await client.droplets.snapshot(droplet.id);
      log(`Snapshot creation started. Waiting ${waitTime} minutes to finish..`)
      setTimeout(() => {
        client.snapshots.list((err, snapshots) => {
          if (err) {
            reject(err)
          } else {
            const snapshot = snapshots.find(snapshot => new Date(snapshot.created_at).toDateString() === new Date().toDateString())
            resolve(snapshot)
          }
        })
      }, waitTime * 60000)
    } catch (err) {
      reject(err)
    }
  })
}).then(function (snapshot) {
  log(`Snapshot "${snapshot.name}" created at ${new Date(snapshot.created_at).toTimeString()}`)
}).catch(function (err) {
  log(`Snapshot creation failed`, err)
});