import { RouterProvider, createRouter } from "@tanstack/react-router";
import { AppProviders } from "@/app/providers";
import { routeTree } from "@/routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
