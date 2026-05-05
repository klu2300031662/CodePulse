"use client"

import ReCAPTCHA from 'react-google-recaptcha'
import { useRef, forwardRef, useImperativeHandle } from 'react'

// Use the test key if no env var is set — Google's official test key always passes
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'

export interface ReCaptchaHandle {
  getToken: () => string | null
  reset: () => void
}

interface ReCaptchaBoxProps {
  onVerify?: (token: string | null) => void
  className?: string
}

const ReCaptchaBox = forwardRef<ReCaptchaHandle, ReCaptchaBoxProps>(
  ({ onVerify, className }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null)

    useImperativeHandle(ref, () => ({
      getToken: () => recaptchaRef.current?.getValue() || null,
      reset: () => recaptchaRef.current?.reset(),
    }))

    return (
      <div className={`flex justify-center ${className || ''}`}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={(token) => onVerify?.(token)}
          onExpired={() => onVerify?.(null)}
          onErrored={() => onVerify?.(null)}
          theme="dark"
        />
      </div>
    )
  }
)

ReCaptchaBox.displayName = 'ReCaptchaBox'

export default ReCaptchaBox
