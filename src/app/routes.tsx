import { createBrowserRouter } from "react-router";

import ProtectedRoute from "./components/ProtectedRoute";
import Punishments from "./pages/Punishments";

export const router = createBrowserRouter([
  {
    path: "/recrutamento",
    lazy: async () => {
      const module = await import("./pages/Recrutamento");
      return { Component: module.default };
    },
  },
  {
    path: "/login",
    lazy: async () => {
      const module = await import("./pages/Login");
      return { Component: module.default };
    },
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        lazy: async () => {
          const module = await import("./pages/Dashboard");
          return { Component: module.default };
        },
      },
      {
        path: "labyrinth",
        lazy: async () => {
          const module = await import("./pages/Labyrinth");
          return { Component: module.default };
        },
      },
      {
        path: "siege-battle",
        lazy: async () => {
          const module = await import("./pages/SiegeBattle");
          return { Component: module.default };
        },
      },
      {
        path: "guild-battle",
        lazy: async () => {
          const module = await import("./pages/GuildBattle");
          return { Component: module.default };
        },
      },
      {
        path: "monster-subjugation",
        lazy: async () => {
          const module = await import("./pages/MonsterSubjugation");
          return { Component: module.default };
        },
      },
      {
        path: "defenses",
        lazy: async () => {
          const module = await import("./pages/Defenses");
          return { Component: module.default };
        },
      },
      {
        path: "events",
        lazy: async () => {
          const module = await import("./pages/EventsCalendar");
          return { Component: module.default };
        },
      },
      {
        path: "admin",
        lazy: async () => {
          const module = await import("./pages/AdminPanel");
          return { Component: module.default };
        },
      },
      {
        path: "admin/import-history",
        lazy: async () => {
          const module = await import("./pages/ImportHistory");
          return { Component: module.default };
        },
      },
      {
        path: "admin/current-state",
        lazy: async () => {
          const module = await import("./pages/CurrentGuildState");
          return { Component: module.default };
        },
      },
      {
        path: "admin/members-access",
        lazy: async () => {
          const module = await import("./pages/MembersAccess");
          return { Component: module.default };
        },
      },
      {
        path: "admin/punishments",
        Component: Punishments,
      },
    ],
  },
]);
