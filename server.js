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
    fs.appendFileSync(config.logFile, logTxt + '\n')
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
            resolve({droplet, snapshot})
          }
        })
      }, waitTime * 60000)
    } catch (err) {
      reject(err)
    }
  })
}).then(async function ({droplet, snapshot}) {
  if (config.delete) {
    const snapshots = await client.droplets.snapshots(droplet.id)
    if (snapshots.length > config.delete.maxCount) {
      log(`There are more than "${config.delete.maxCount}" snapshots. Proceeding to remove the oldest..`)
      const oldestSnapshot = snapshots.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]
      await client.snapshots.delete(oldestSnapshot.id)
      log(`Oldest snapshot "${oldestSnapshot.name}", created at ${new Date(oldestSnapshot.created_at).toTimeString()}, was deleted.`)
    }
  }
  log(`Snapshot "${snapshot.name}" created at ${new Date(snapshot.created_at).toTimeString()}`)
}).catch(function (err) {
  log(`Snapshot creation failed \n${err}`)
});