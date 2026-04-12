import { RouterProvider } from 'react-router';
import { router } from './routes';
import { DataProvider } from './context/DataContext';
import { GuildWeekProvider } from './context/GuildWeekContext';

export default function App() {
  return (
    <DataProvider>
      <GuildWeekProvider>
        <RouterProvider router={router} />
      </GuildWeekProvider>
    </DataProvider>
  );
}
