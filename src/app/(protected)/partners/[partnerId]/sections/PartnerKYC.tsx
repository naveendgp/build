'use client'

import { Card, Descriptions, Tag } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'

interface KYCData {
    panNumber?: string
    panVerified?: boolean
    gstNumber?: string
    gstVerified?: boolean
    bankAccount?: string
    bankIFSC?: string
    bankVerified?: boolean
    submittedAt?: string
}

function VerificationTag({ verified }: { verified?: boolean }) {
    if (verified === true) return <Tag icon={<CheckCircleOutlined />} color="success">Verified</Tag>
    if (verified === false) return <Tag icon={<CloseCircleOutlined />} color="error">Not Verified</Tag>
    return <Tag icon={<ClockCircleOutlined />} color="default">Pending</Tag>
}

export default function PartnerKYC({ kyc }: { kyc?: KYCData }) {
    if (!kyc) {
        return (
            <Card title="KYC Details">
                <p style={{ color: '#999' }}>No KYC data submitted</p>
            </Card>
        )
    }

    return (
        <Card title="KYC Details">
            <Descriptions column={1} size="small">
                <Descriptions.Item label="PAN Number">
                    {kyc.panNumber ?? '—'} <VerificationTag verified={kyc.panVerified} />
                </Descriptions.Item>
                <Descriptions.Item label="GST Number">
                    {kyc.gstNumber ?? '—'} <VerificationTag verified={kyc.gstVerified} />
                </Descriptions.Item>
                <Descriptions.Item label="Bank Account">{kyc.bankAccount ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="IFSC Code">{kyc.bankIFSC ?? '—'}</Descriptions.Item>
                <Descriptions.Item label="Bank Verification">
                    <VerificationTag verified={kyc.bankVerified} />
                </Descriptions.Item>
                {kyc.submittedAt && (
                    <Descriptions.Item label="Submitted">
                        {new Date(kyc.submittedAt).toLocaleString()}
                    </Descriptions.Item>
                )}
            </Descriptions>
        </Card>
    )
}
