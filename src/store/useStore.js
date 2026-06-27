import { create } from 'zustand';
import {
  getAllPlants, addPlant as dbAddPlant, updatePlant as dbUpdatePlant,
  deletePlant as dbDeletePlant, getPlant,
  getPhotosByPlant, addPhoto as dbAddPhoto, deletePhoto as dbDeletePhoto,
  getWateringsByPlant, addWatering as dbAddWatering,
  getMilestonesByPlant, addMilestone as dbAddMilestone, deleteMilestone as dbDeleteMilestone,
  getSetting, setSetting as dbSetSetting
} from '../db/indexedDB';

const useStore = create((set, get) => ({
  // Plants
  plants: [],
  loading: false,

  loadPlants: async () => {
    set({ loading: true });
    const plants = await getAllPlants();
    plants.sort((a, b) => b.createdAt - a.createdAt);
    set({ plants, loading: false });
  },

  addPlant: async (plant) => {
    const newPlant = await dbAddPlant(plant);
    set((s) => ({ plants: [newPlant, ...s.plants] }));
    return newPlant;
  },

  updatePlant: async (id, updates) => {
    const updated = await dbUpdatePlant(id, updates);
    set((s) => ({
      plants: s.plants.map((p) => (p.id === id ? updated : p))
    }));
    return updated;
  },

  deletePlant: async (id) => {
    await dbDeletePlant(id);
    set((s) => ({ plants: s.plants.filter((p) => p.id !== id) }));
  },

  // Photos
  loadPhotos: async (plantId) => {
    const photos = await getPhotosByPlant(plantId);
    photos.sort((a, b) => b.takenAt - a.takenAt);
    return photos;
  },

  addPhoto: async (photo) => {
    return await dbAddPhoto(photo);
  },

  deletePhoto: async (id) => {
    await dbDeletePhoto(id);
  },

  // Waterings
  loadWaterings: async (plantId) => {
    const waterings = await getWateringsByPlant(plantId);
    waterings.sort((a, b) => b.wateredAt - a.wateredAt);
    return waterings;
  },

  addWatering: async (watering) => {
    return await dbAddWatering(watering);
  },

  // Milestones
  loadMilestones: async (plantId) => {
    return await getMilestonesByPlant(plantId);
  },

  addMilestone: async (milestone) => {
    return await dbAddMilestone(milestone);
  },

  deleteMilestone: async (id) => {
    await dbDeleteMilestone(id);
  },

  // Settings
  reminderEnabled: false,
  reminderDay: 0,
  reminderHour: 10,
  reminderMinute: 0,

  loadSettings: async () => {
    const enabled = await getSetting('reminderEnabled');
    const day = await getSetting('reminderDay');
    const hour = await getSetting('reminderHour');
    const minute = await getSetting('reminderMinute');
    set({
      reminderEnabled: enabled === true,
      reminderDay: day ?? 0,
      reminderHour: hour ?? 10,
      reminderMinute: minute ?? 0
    });
  },

  setReminder: async (enabled, day, hour, minute) => {
    await dbSetSetting('reminderEnabled', enabled);
    await dbSetSetting('reminderDay', day);
    await dbSetSetting('reminderHour', hour);
    await dbSetSetting('reminderMinute', minute);
    set({ reminderEnabled: enabled, reminderDay: day, reminderHour: hour, reminderMinute: minute });
  }
}));

export default useStore;
