import { openDB } from 'idb';

const DB_NAME = 'stagtrace-db';
const DB_VERSION = 2;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const plantStore = db.createObjectStore('plants', { keyPath: 'id' });
          plantStore.createIndex('createdAt', 'createdAt');

          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('plantId', 'plantId');
          photoStore.createIndex('takenAt', 'takenAt');
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('waterings')) {
            const wateringStore = db.createObjectStore('waterings', { keyPath: 'id' });
            wateringStore.createIndex('plantId', 'plantId');
            wateringStore.createIndex('wateredAt', 'wateredAt');
          }
          if (!db.objectStoreNames.contains('milestones')) {
            const milestoneStore = db.createObjectStore('milestones', { keyPath: 'id' });
            milestoneStore.createIndex('plantId', 'plantId');
            milestoneStore.createIndex('photoId', 'photoId');
          }
        }
      }
    });
  }
  return dbPromise;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// --- Plants ---
export async function getAllPlants() {
  const db = await getDB();
  return db.getAllFromIndex('plants', 'createdAt');
}

export async function getPlant(id) {
  const db = await getDB();
  return db.get('plants', id);
}

export async function addPlant(plant) {
  const db = await getDB();
  const newPlant = { ...plant, id: uid(), createdAt: Date.now() };
  await db.add('plants', newPlant);
  return newPlant;
}

export async function updatePlant(id, updates) {
  const db = await getDB();
  const plant = await db.get('plants', id);
  if (!plant) throw new Error('Plant not found');
  Object.assign(plant, updates, { updatedAt: Date.now() });
  await db.put('plants', plant);
  return plant;
}

export async function deletePlant(id) {
  const db = await getDB();
  const tx = db.transaction(['plants', 'photos', 'waterings', 'milestones'], 'readwrite');
  await Promise.all([
    tx.objectStore('plants').delete(id),
    ...['photos', 'waterings', 'milestones'].map(async (storeName) => {
      const store = tx.objectStore(storeName);
      const index = store.index('plantId');
      let cursor = await index.openCursor(IDBKeyRange.only(id));
      while (cursor) {
        store.delete(cursor.primaryKey);
        cursor = await cursor.continue();
      }
    })
  ]);
  await tx.done;
}

// --- Photos ---
export async function getPhotosByPlant(plantId) {
  const db = await getDB();
  return db.getAllFromIndex('photos', 'plantId', plantId);
}

export async function getPhoto(id) {
  const db = await getDB();
  return db.get('photos', id);
}

export async function addPhoto(photo) {
  const db = await getDB();
  const newPhoto = { ...photo, id: uid(), takenAt: Date.now() };
  await db.add('photos', newPhoto);
  return newPhoto;
}

export async function deletePhoto(id) {
  const db = await getDB();
  const tx = db.transaction(['photos', 'milestones'], 'readwrite');
  await tx.objectStore('photos').delete(id);
  const milestoneIndex = tx.objectStore('milestones').index('photoId');
  let cursor = await milestoneIndex.openCursor(IDBKeyRange.only(id));
  while (cursor) {
    tx.objectStore('milestones').delete(cursor.primaryKey);
    cursor = await cursor.continue();
  }
  await tx.done;
}

// --- Waterings ---
export async function getWateringsByPlant(plantId) {
  const db = await getDB();
  return db.getAllFromIndex('waterings', 'plantId', plantId);
}

export async function addWatering(watering) {
  const db = await getDB();
  const newWatering = { ...watering, id: uid(), wateredAt: Date.now() };
  await db.add('waterings', newWatering);
  return newWatering;
}

export async function getLastWatering(plantId) {
  const db = await getDB();
  const all = await db.getAllFromIndex('waterings', 'plantId', plantId);
  if (all.length === 0) return null;
  all.sort((a, b) => b.wateredAt - a.wateredAt);
  return all[0];
}

// --- Milestones ---
export async function getMilestonesByPlant(plantId) {
  const db = await getDB();
  return db.getAllFromIndex('milestones', 'plantId', plantId);
}

export async function addMilestone(milestone) {
  const db = await getDB();
  const newMilestone = { ...milestone, id: uid(), createdAt: Date.now() };
  await db.add('milestones', newMilestone);
  return newMilestone;
}

export async function deleteMilestone(id) {
  const db = await getDB();
  await db.delete('milestones', id);
}

export async function getMilestoneByPhotoId(photoId) {
  const db = await getDB();
  return db.getFromIndex('milestones', 'photoId', photoId);
}

// --- Settings ---
export async function getSetting(key) {
  const db = await getDB();
  const record = await db.get('settings', key);
  return record ? record.value : null;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getAllSettings() {
  const db = await getDB();
  return db.getAll('settings');
}
