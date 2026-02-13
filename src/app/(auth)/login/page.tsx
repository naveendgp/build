'use client'

import { useState } from 'react'
import { Button, Form, Input, Alert } from 'antd'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const onFinish = async (values: { email: string; password: string }) => {
        setError(null)
        setLoading(true)

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.message ?? 'Login failed')
                return
            }

            window.location.href = '/'
        } catch {
            setError('Network error — please try again')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: 360, margin: '120px auto' }}>
            <h1>Admin Login</h1>
            {error && (
                <Alert
                    message={error}
                    type="error"
                    showIcon
                    closable
                    style={{ marginBottom: 16 }}
                />
            )}
            <Form onFinish={onFinish} layout="vertical">
                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Email is required' },
                        { type: 'email', message: 'Enter a valid email' },
                    ]}
                >
                    <Input autoComplete="email" />
                </Form.Item>
                <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, message: 'Password is required' }]}
                >
                    <Input.Password autoComplete="current-password" />
                </Form.Item>
                <Button
                    htmlType="submit"
                    type="primary"
                    loading={loading}
                    block
                >
                    Login
                </Button>
            </Form>
        </div>
    )
}
