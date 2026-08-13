const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "macro-stage-rt8c4"
});
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('jobs').get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=> techId:', doc.data().technicianId, 'createdBy:', doc.data().createdBy);
  });
}
run();
