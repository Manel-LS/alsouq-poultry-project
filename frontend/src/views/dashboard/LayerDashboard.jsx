// src/views/dashboard/LayerDashboard.js
import React, { useState, useEffect } from "react";
import { CCard, CCardBody, CCardHeader, CRow, CCol } from "@coreui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import useAuth from '../../auth/useAuth';

const productionData = [
  { day: "الاثنين", eggs: 120 },
  { day: "الثلاثاء", eggs: 150 },
  { day: "الأربعاء", eggs: 140 },
];

const LayerDashboard = () => {
  const { checkTokenValidity } = useAuth();

  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  const [totalBirds, setTotalBirds] = useState(300);
  const [dailyEggs, setDailyEggs] = useState(150);
  const [mortality, setMortality] = useState(3);

  return (
    <div dir="rtl">
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard className="text-center">
            <CCardHeader>إجمالي الطيور</CCardHeader>
            <CCardBody>{totalBirds} طائر</CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="text-center">
            <CCardHeader>إجمالي البيض اليومي</CCardHeader>
            <CCardBody>{dailyEggs} بيضة</CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="text-center">
            <CCardHeader>نسبة النفوق</CCardHeader>
            <CCardBody>{mortality}%</CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CCard className="mb-4">
        <CCardHeader>إنتاج البيض اليومي</CCardHeader>
        <CCardBody style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="eggs" stroke="#52d7c6" name="عدد البيض" />
            </LineChart>
          </ResponsiveContainer>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default LayerDashboard;
