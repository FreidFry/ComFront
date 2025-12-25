import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './AuthContext';
import type { NotificationContextType, MyNotification } from '../types/api';
import { apiService } from '../services/api';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<MyNotification[]>([]);

    // 2. Функция "Прочитать одно"
    const markAsRead = async (id: string) => {
    try {
        await apiService.markAsRead(id);
        // Обновляем UI: удаляем уведомление из списка
        setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
        console.error("Failed to mark notification as read", err);
    }
};

    // 3. Функция "Прочитать все"
    const markAllAsRead = async () => {
    try {
        await apiService.markAllAsRead();
        // Обновляем UI: очищаем список
        setNotifications([]);
    } catch (err) {
        console.error("Failed to mark all notifications as read", err);
    }
};

    useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Сначала загружаем "историю" из базы через обычный API
    const loadHistory = async () => {
    try {
        const history = await apiService.getNotifications();
        
        setNotifications(history);
    } catch (err) {
        console.error("Ошибка загрузки истории уведомлений:", err);
    }
};

    loadHistory();

    const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:8081/notificationHub", {
        withCredentials: true 
    })
        .withAutomaticReconnect()
        .build();

    const startConnection = async () => {
            try {
                // Проверяем, что соединение все еще в состоянии Disconnected перед стартом
                if (connection.state === signalR.HubConnectionState.Disconnected) {
                    await connection.start();
                }
            } catch (err) {
                console.error("SignalR Connection Errr: ", err);
                setTimeout(startConnection, 5000);
            }
        };

    connection.on("ReceiveNotification", (notification: MyNotification) => {
        // Добавляем новое уведомление в начало списка
        setNotifications(prev => [notification, ...prev]);
        toast.info(notification.title);
    });

    startConnection();

    return () => { connection.stop(); };
}, [isAuthenticated]);

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount: notifications.length,
            markAsRead,
            markAllAsRead
        }}>
            {children}
            <ToastContainer position="bottom-right" theme="dark" />
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error("useNotifications must be used within NotificationProvider");
    return context;
};