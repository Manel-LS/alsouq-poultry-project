import React from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CFormCheck,
  CAlert,
  CLink
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser, cilEnvelopeOpen, cilShortText, cilPhone, cilAccountLogout } from '@coreui/icons'

const Register = () => {
  return (
    <div className="bg-gradient-light min-vh-100 d-flex flex-row align-items-center" dir="rtl">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8} lg={6} xl={5}>
            <CCard className="shadow-lg border-0 rounded-4">
              <CCardBody className="p-5">
                <div className="text-center mb-4">
                  <h2 className="text-dark fw-bold">إنشاء حساب جديد</h2>
                  <p className="text-muted">ابدأ رحلتك معنا اليوم</p>
                </div>

                <CForm>
                  {/* معلومات أساسية */}
                  <div className="mb-4">
                    <CInputGroup className="mb-3">
                      <CInputGroupText className="bg-light">
                        <CIcon icon={cilUser} className="text-primary" />
                      </CInputGroupText>
                      <CFormInput 
                        placeholder="الاسم الكامل" 
                        className="border-start-0"
                        dir="rtl"
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-3">
                      <CInputGroupText className="bg-light">
                        <CIcon icon={cilEnvelopeOpen} className="text-primary" />
                      </CInputGroupText>
                      <CFormInput 
                        type="email" 
                        placeholder="البريد الإلكتروني" 
                        className="border-start-0"
                        dir="auto"
                        style={{
                          direction: 'ltr',
                          textAlign: 'right',
                          unicodeBidi: 'isolate'
                        }}
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-3">
                      <CInputGroupText className="bg-light">
                        <CIcon icon={cilPhone} className="text-primary" />
                      </CInputGroupText>
                      <CFormInput 
                        placeholder="رقم الهاتف" 
                        className="border-start-0"
                        dir="rtl"
                      />
                    </CInputGroup>
                  </div>

                  {/* أمان الحساب */}
                  <div className="mb-4">
                    <CInputGroup className="mb-3">
                      <CInputGroupText className="bg-light">
                        <CIcon icon={cilLockLocked} className="text-primary" />
                      </CInputGroupText>
                      <CFormInput 
                        type="password" 
                        placeholder="كلمة المرور" 
                        className="border-start-0"
                        dir="rtl"
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-3">
                      <CInputGroupText className="bg-light">
                        <CIcon icon={cilLockLocked} className="text-primary" />
                      </CInputGroupText>
                      <CFormInput 
                        type="password" 
                        placeholder="تأكيد كلمة المرور" 
                        className="border-start-0"
                        dir="rtl"
                      />
                    </CInputGroup>
                  </div>

                  {/* الشروط والأحكام */}
                  <div className="mb-4">
                    <CFormCheck
                      id="terms"
                      label="أوافق على الشروط والأحكام وسياسة الخصوصية"
                      className="mb-3"
                    />
                  </div>

                  {/* زر التسجيل */}
                  <div className="d-grid gap-2 mb-3">
                    <CButton color="primary" size="lg" className="fw-bold rounded-3">
                      إنشاء حساب
                    </CButton>
                  </div>

                  {/* زر التوجه لتسجيل الدخول */}
                  <div className="text-center mt-4">
                    <CButton 
                      color="outline-primary" 
                      variant="outline" 
                      className="d-flex align-items-center justify-content-center gap-2 w-100"
                      href="#/login"
                    >
                      <CIcon icon={cilAccountLogout} />
                      <span>لديك حساب بالفعل؟ تسجيل الدخول</span>
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Register