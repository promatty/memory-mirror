"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = 
		new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 5 * 60 * 1000, // 5 minutes
					gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
					refetchOnWindowFocus: false,
					retry: 1,
				},
				mutations: {
					retry: 1,
				},
			},
		})
export const QueryProvider = ({ children }: { children: React.ReactNode }) => {

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
};

