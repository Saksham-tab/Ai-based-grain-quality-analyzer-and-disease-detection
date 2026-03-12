import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import mqtt from "mqtt";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MqttContextType {
    connected: boolean;
    isCapturing: boolean;
    lastImage: string | null;
    statusMessage: string;
    lastResult: any | null;
    triggerCapture: () => Promise<void>;
    logs: { msg: string; ts: Date }[];
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

import apiService from "./apiService";
import socketService from "./socketService";

export function MqttProvider({ children }: { children: ReactNode }) {
    const [client, setClient] = useState<mqtt.MqttClient | null>(null);
    const [connected, setConnected] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [lastImage, setLastImage] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("Idle");
    const [lastResult, setLastResult] = useState<any | null>(null);
    const [logs, setLogs] = useState<{ msg: string; ts: Date }[]>([]);
    const queryClient = useQueryClient();

    const addLog = (msg: string) => {
        setLogs((prev) => [{ msg, ts: new Date() }, ...prev].slice(0, 50));
    };

    useEffect(() => {
        // ws://your-broker-ip:9001 - Using localhost as default or env
        const brokerUrl = (import.meta as any).env.VITE_MQTT_BROKER_URL || "ws://localhost:9001";
        const topicStatus = (import.meta as any).env.VITE_MQTT_TOPIC_STATUS || "grain/camera/status";
        const topicImage = (import.meta as any).env.VITE_MQTT_TOPIC_IMAGE || "grain/camera/image";
        const topicResult = (import.meta as any).env.VITE_MQTT_TOPIC_RESULT || "grain/quality/result";
        console.log("🔌 Connecting to MQTT:", brokerUrl);

        const mqttClient = mqtt.connect(brokerUrl, {
            reconnectPeriod: 5000,
        });

        mqttClient.on("connect", () => {
            console.log("✅ MQTT Connected");
            setConnected(true);
            addLog("MQTT Connected");

            mqttClient.subscribe([
                topicStatus,
                topicImage,
                topicResult
            ]);
        });

        mqttClient.on("message", (topic, payload) => {
            const message = payload.toString();

            if (topic === topicStatus) {
                addLog(`Status: ${message}`);
                if (message === "capturing") {
                    setIsCapturing(true);
                    setStatusMessage("Capturing...");
                } else if (message === "completed") {
                    setIsCapturing(false);
                    setStatusMessage("Idle");
                    toast.success("Capture completed!");
                }
            }
            else if (topic === topicImage) {
                setLastImage(message); // Assuming base64
                addLog("Received new image");
            }
            else if (topic === topicResult) {
                try {
                    const result = JSON.parse(message);
                    setLastResult(result);
                    addLog("Received analysis result");
                    // Update the global grain data cache
                    queryClient.setQueryData(["grainData"], result);
                } catch (e) {
                    console.error("Failed to parse MQTT result", e);
                }
            }
        });

        mqttClient.on("disconnect", () => {
            setConnected(false);
            addLog("MQTT Disconnected");
        });

        mqttClient.on("error", (err) => {
            console.error("MQTT Error:", err);
            addLog(`Error: ${err.message}`);
        });

        const unbindStatus = socketService.onCameraStatus((message: string) => {
            console.log(`[Frontend Relay] Received Camera Status: ${message}`);
            addLog(`[Relay] Status: ${message}`);
            if (message === "capturing") {
                setIsCapturing(true);
                setStatusMessage("Capturing...");
            } else if (message === "completed") {
                setIsCapturing(false);
                setStatusMessage("Idle");
                toast.success("Capture completed via relay!");
            }
        });

        const unbindImage = socketService.onCameraImage((message: string) => {
            console.log("[Frontend Relay] Received New Image");
            setLastImage(message);
            addLog("[Relay] Received new image");
        });

        setClient(mqttClient);

        return () => {
            mqttClient.end();
            unbindStatus();
            unbindImage();
        };
    }, [queryClient]);

    const triggerCapture = async () => {
        setIsCapturing(true);
        setStatusMessage("Requesting capture...");
        try {
            await apiService.captureGrain();
            addLog("Capture command sent to backend");
        } catch (error) {
            setIsCapturing(false);
            setStatusMessage("Error");
            toast.error("Failed to trigger capture");
            addLog("Capture trigger failed");
        }
    };

    return (
        <MqttContext.Provider
            value={{
                connected,
                isCapturing,
                lastImage,
                statusMessage,
                lastResult,
                triggerCapture,
                logs,
            }}
        >
            {children}
        </MqttContext.Provider>
    );
}

export function useMqtt() {
    const context = useContext(MqttContext);
    if (context === undefined) {
        throw new Error("useMqtt must be used within an MqttProvider");
    }
    return context;
}


