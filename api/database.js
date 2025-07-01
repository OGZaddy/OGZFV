const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert('path/to/serviceAccountKey.json'),
    databaseURL: 'https://your-database.firebaseio.com'
});
const db = admin.database();

async function saveTrade(userId, tradeData) {
    await db.ref(`trades/${userId}/${tradeData.id}`).set(tradeData);
}

async function getTrades(userId) {
    const snapshot = await db.ref(`trades/${userId}`).once('value');
    return snapshot.val();
}