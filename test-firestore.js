const admin = require('firebase-admin');
admin.initializeApp({
  projectId: "macro-stage-rt8c4"
});
const db = admin.firestore();
async function run() {
  const snapshot = await db.collection('jobs').get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data().technicianId, doc.data().createdBy);
  });
}
run();
