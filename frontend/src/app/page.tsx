'use client';

import { useState, useEffect } from 'react';

interface Task {
    id: number;
    title: string;
    completed: boolean;
}

export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/tasks');
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const createTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            const response = await fetch('http://localhost:8080/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTaskTitle, completed: false }),
            });

            if (response.ok) {
                setNewTaskTitle('');
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    };

    const deleteTask = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/tasks/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
    };

    return (
        <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1>タスク管理</h1>

            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>新しいタスクを追加</h2>
                <form onSubmit={createTask} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="タスクを入力..."
                        style={{ flex: 1, padding: '0.5rem' }}
                    />
                    <button type="submit" style={{ padding: '0.5rem 1rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        ADD
                    </button>
                </form>
            </div>

            <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h2>タスク一覧</h2>
                {tasks.length === 0 ? (
                    <p>タスクがありません。</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {tasks.map((task) => (
                            <li key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <span>{task.title}</span>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    style={{ padding: '0.25rem 0.5rem', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    削除
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
