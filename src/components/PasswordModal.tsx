'use client'

import { Modal, Form, Input, Alert, message } from 'antd'
import { useState } from 'react'

interface Props {
  userId: string
  open: boolean
  onClose: () => void
}

export default function PasswordResetModal({
  userId,
  open,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const res = await fetch(`/api/users/${userId}/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: values.reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Password reset failed')
      }

      message.success(
        'Password reset link sent to user successfully'
      )
      form.resetFields()
      onClose()
    } catch (err: any) {
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Trigger Password Reset"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      okText="Send Reset Link"
      okButtonProps={{ loading }}
    >
      <Alert
        type="warning"
        showIcon
        message="This will send a password reset link to the user. You will not see or set the password."
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          name="reason"
          label="Reason"
          rules={[
            { required: true, message: 'Reason is required' },
            { min: 3, message: 'Provide a meaningful reason' },
          ]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
