// server.js
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./config/firebase-config');
const app = express();

app.use(bodyParser.json());

let previousList = []; // List of previously detected unique IDs

// Function to save detected unique IDs to Firestore
async function saveToFirestore(line, intersection, zone, id, onTrack, timestamp) {
  try {
    const docRef = db.collection(line)
      .doc(intersection)
      .collection('zones')
      .doc(zone)
      .collection('Users Detected')
      .doc(id);

    const data = {
      onTrack: onTrack,
      intersection: intersection,
      zone: zone,
    };

    if (onTrack) {
      data.entryTime = timestamp; // Store entry time if onTrack
    } else {
      data.exitTime = timestamp; // Store exit time if offTrack
    }

    await docRef.set(data, { merge: true });
  } catch (error) {
    console.error(`Error saving ID ${id} to Firestore:`, error);
  }
}

// POST endpoint to receive data from the receiver
app.post('/data', async (req, res) => {
  try {
    const { line, intersection, zone, uniqueIDs } = req.body;

    if (!line || !intersection || !zone || !Array.isArray(uniqueIDs)) {
      return res.status(400).send('Invalid request data');
    }

    const currentList = uniqueIDs || [];
    const detectedTime = new Date();

    // Compare previous list and current list
    const newlyDetected = currentList.filter(id => !previousList.includes(id));
    const noLongerDetected = previousList.filter(id => !currentList.includes(id));

    console.log('Newly Detected:', newlyDetected);
    console.log('No Longer Detected:', noLongerDetected);

    // Save newly detected IDs
    for (const id of newlyDetected) {
      await saveToFirestore(line, intersection, zone, id, true, detectedTime);
    }

    // Update no longer detected IDs
    for (const id of noLongerDetected) {
      await saveToFirestore(line, intersection, zone, id, false, detectedTime);
    }

    // Update previous list to the current list for the next comparison
    previousList = currentList;

    res.status(200).send('Data processed successfully');
  } catch (error) {
    console.error('Error processing data:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
