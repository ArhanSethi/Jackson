import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// SPRINT3.md Ticket 3.2: Clerk needs a persistent token cache on native
// (SecureStore). SecureStore has no web implementation, so on web we fall
// back to no cache — Clerk keeps the session in memory there instead.
export const tokenCache =
  Platform.OS === 'web'
    ? undefined
    : {
        async getToken(key: string) {
          try {
            return await SecureStore.getItemAsync(key);
          } catch {
            return null;
          }
        },
        async saveToken(key: string, value: string) {
          try {
            await SecureStore.setItemAsync(key, value);
          } catch {
            // ignore
          }
        },
      };
