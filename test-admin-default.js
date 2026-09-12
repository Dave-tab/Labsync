import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'hallowed-micron-4ds98'
});

const db = getFirestore('ai-studio-e81e249d-2fb0-4159-ad1a-e5eff0833c8e');
db.collection('system').doc('health').get()
  .then(doc => console.log('Success:', doc.exists))
  .catch(err => console.error('Error:', err));
