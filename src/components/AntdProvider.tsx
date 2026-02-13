'use client'

import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'

export default function AntdProvider({ children }: { children: React.ReactNode }) {
    return (
        <ConfigProvider locale={enUS}>
            {children}
        </ConfigProvider>
    )
}
