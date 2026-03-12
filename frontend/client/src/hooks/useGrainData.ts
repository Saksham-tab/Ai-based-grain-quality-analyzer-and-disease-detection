import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import apiService from "../services/apiService";
import socketService from "../services/socketService";
import { GrainData } from "../types";

export function useGrainData() {
    const queryClient = useQueryClient();
    const [connected, setConnected] = useState(socketService.isConnected());

    const query = useQuery<GrainData>({
        queryKey: ["grainData"],
        queryFn: async () => {
            console.log("🔄 Fetching latest grain report...");
            const data = await apiService.getLatestReport();
            return data;
        },
        staleTime: Infinity, // Data remains fresh until manually invalidated
        gcTime: Infinity,    // Keep data in cache as long as possible
    });

    useEffect(() => {
        const socket = socketService.getSocket();

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        if (socket) {
            socket.on("connect", handleConnect);
            socket.on("disconnect", handleDisconnect);
        }

        // Subscribe to full AI reports (saved from MongoDB)
        const unsubReport = socketService.onReportUpdate((report) => {
            console.log("📊 Received new report via socket, updating cache:", report);
            queryClient.setQueryData(["grainData"], report);
        });

        // Also update partial live sensor data if needed
        const unsubSensor = socketService.onGrainDataUpdate((newData) => {
            // Only update if it's "live" and not fallback/error
            if (!newData?._isFallback) {
                queryClient.setQueryData(["grainData"], (old: GrainData | undefined) => {
                    if (!old) return old;
                    return {
                        ...old,
                        sensorSnapshot: {
                            temperature: newData.temperature,
                            humidity: newData.humidity,
                            moisture: newData.moisture,
                        },
                        // Update root fields for convenience if they match
                        temperature: newData.temperature,
                        humidity: newData.humidity,
                        moisture: newData.moisture,
                    };
                });
            }
        });

        return () => {
            if (socket) {
                socket.off("connect", handleConnect);
                socket.off("disconnect", handleDisconnect);
            }
            unsubReport();
            unsubSensor();
        };
    }, [queryClient]);

    return { ...query, connected };
}
