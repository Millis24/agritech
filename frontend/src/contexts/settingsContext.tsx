// // File: src/contexts/SettingsContext.tsx
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { getUserProfile, updateUserProfile } from '../api/user';

// type Settings = {
//   notifySync: boolean;
//   notifyErrors: boolean;
//   darkMode: boolean;
// };
// type SettingsContextType = Settings & {
//   saveSettings: (data: Partial<Settings>) => Promise<void>;
// };

// const SettingsContext = createContext<SettingsContextType>({
//   notifySync: false,
//   notifyErrors: false,
//   darkMode: false,
//   saveSettings: async () => {},
// });

// export function SettingsProvider({ children }: { children: React.ReactNode }) {
//   const [settings, setSettings] = useState<Settings>({
//     notifySync: false,
//     notifyErrors: false,
//     darkMode: false,
//   });

//   // Carica all’avvio dal backend
//   useEffect(() => {
//     (async () => {
//       const profile = await getUserProfile();
//       setSettings({
//         notifySync: profile.notifySync,
//         notifyErrors: profile.notifyErrors,
//         darkMode: profile.darkMode,
//       });
//     })();
//   }, []);

//   // Funzione per aggiornare backend + context
//   const saveSettings = async (data: Partial<Settings>) => {
//     await updateUserProfile(data);
//     setSettings(current => ({ ...current, ...data }));
//   };

//   return (
//     <SettingsContext.Provider value={{ ...settings, saveSettings }}>
//       {children}
//     </SettingsContext.Provider>
//   );
// }

// export function useSettings() {
//   return useContext(SettingsContext);
// }