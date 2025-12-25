import * as signalR from "@microsoft/signalr";
import { toast } from "react-toastify";

// Интерфейс должен совпадать с твоей NotificationViewModel на бэкенде
export interface NotificationViewModel {
    id: number;
    title: string;
    message: string;
    type: string;
    creatorName: string;
    createdAt: string;
}

export const setupSignalR = (token: string) => {
    const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7154/notifications", { // Укажи свой URL хаба
            accessTokenFactory: () => token // Передаем JWT токен для авторизации
        })
        .withAutomaticReconnect()
        .build();

    // Слушаем событие, которое мы прописали в воркере: .SendAsync("ReceiveNotification", ...)
    connection.on("ReceiveNotification", (notification: NotificationViewModel) => {
        toast.info(`${notification.title}: ${notification.message}`, {
            position: "top-right",
            autoClose: 5000,
        });
        
        // Здесь можно также обновить глобальное состояние (например, Redux или Zustand)
        // чтобы увеличить счетчик на иконке колокольчика
    });

    connection.start().catch(err => console.error("SignalR Connection Error: ", err));

    return connection;
};