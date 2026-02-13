'use client'

import { useState } from 'react'
import { Card, Button, Space } from 'antd'
import { PermissionGate } from '@/components/PermissionGate'
import UserStatusModal from '@/components/UserStatusModal'
import PasswordResetModal from '@/components/PasswordModal'

export default function UserActions({ user }: { user: any }) {
    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [targetEnabled, setTargetEnabled] = useState(true)
    const [passwordModalOpen, setPasswordModalOpen] = useState(false)

    const openDisable = () => {
        setTargetEnabled(false)
        setStatusModalOpen(true)
    }

    const openEnable = () => {
        setTargetEnabled(true)
        setStatusModalOpen(true)
    }

    return (
        <>
            <Card title="Actions">
                <Space>
                    <PermissionGate permission="USER_WRITE">
                        {user.isActive ? (
                            <Button danger onClick={openDisable}>
                                Disable User
                            </Button>
                        ) : (
                            <Button type="primary" onClick={openEnable}>
                                Enable User
                            </Button>
                        )}
                    </PermissionGate>

                    <PermissionGate permission="USER_WRITE">
                        <Button onClick={() => setPasswordModalOpen(true)}>
                            Reset Password
                        </Button>
                    </PermissionGate>
                </Space>
            </Card>

            <UserStatusModal
                userId={user.id}
                enabled={targetEnabled}
                open={statusModalOpen}
                onClose={() => setStatusModalOpen(false)}
                onSuccess={() => window.location.reload()}
            />

            <PasswordResetModal
                userId={user.id}
                open={passwordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
            />
        </>
    )
}
