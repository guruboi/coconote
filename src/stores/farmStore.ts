import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Farm, FarmMode, FarmViewState } from '@/types/farm.types';

interface FarmState {
  farms: Farm[];
  currentFarmId: string | null;
  viewState: FarmViewState;

  // Farm management
  addFarm: (farm: Farm) => void;
  updateFarm: (farmId: string, updates: Partial<Farm>) => void;
  deleteFarm: (farmId: string) => void;
  setCurrentFarm: (farmId: string) => void;

  // View state management
  setMode: (mode: FarmMode) => void;
  setSelectedLayer: (layer: number) => void;
  selectElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;

  // Getters
  getCurrentFarm: () => Farm | null;
}

export const useFarmStore = create<FarmState>()(
  persist(
    (set, get) => ({
      farms: [],
      currentFarmId: null,
      viewState: {
        mode: 'view',
        selectedLayer: 1,
        selectedElements: [],
        zoom: 1,
        pan: { x: 0, y: 0 },
      },

      addFarm: (farm) => set((state) => ({
        farms: [...state.farms, farm],
        currentFarmId: farm.id,
      })),

      updateFarm: (farmId, updates) => set((state) => ({
        farms: state.farms.map((farm) =>
          farm.id === farmId
            ? { ...farm, ...updates, updatedAt: new Date() }
            : farm
        ),
      })),

      deleteFarm: (farmId) => set((state) => ({
        farms: state.farms.filter((farm) => farm.id !== farmId),
        currentFarmId: state.currentFarmId === farmId ? null : state.currentFarmId,
      })),

      setCurrentFarm: (farmId) => set({
        currentFarmId: farmId,
        viewState: {
          mode: 'view',
          selectedLayer: 1,
          selectedElements: [],
          zoom: 1,
          pan: { x: 0, y: 0 },
        },
      }),

      setMode: (mode) => set((state) => ({
        viewState: { ...state.viewState, mode },
      })),

      setSelectedLayer: (layer) => set((state) => ({
        viewState: { ...state.viewState, selectedLayer: layer },
      })),

      selectElements: (elementIds) => set((state) => ({
        viewState: { ...state.viewState, selectedElements: elementIds },
      })),

      clearSelection: () => set((state) => ({
        viewState: { ...state.viewState, selectedElements: [] },
      })),

      setZoom: (zoom) => set((state) => ({
        viewState: { ...state.viewState, zoom },
      })),

      setPan: (x, y) => set((state) => ({
        viewState: { ...state.viewState, pan: { x, y } },
      })),

      getCurrentFarm: () => {
        const { farms, currentFarmId } = get();
        return farms.find((farm) => farm.id === currentFarmId) || null;
      },
    }),
    {
      name: 'coconotecc-farms',
    }
  )
);
