import { useSyncExternalStore } from 'react';
import { getState, subscribe } from '../data/store';

export function useAppState() {
  return useSyncExternalStore(subscribe, getState, getState);
}
